const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const ok=data=>json({ok:true,data});
const fail=(error,status=400,code="REQUEST_FAILED",details=null)=>json({ok:false,error:String(error||"Course Ops request failed."),code,...(details?{details}:{})},status);

class CanvasRequestError extends Error{
  constructor(message,{status=502,code='CANVAS_REQUEST_FAILED',endpoint='',canvasMessage=''}={}){
    super(message);this.name='CanvasRequestError';this.status=status;this.code=code;this.endpoint=endpoint;this.canvasMessage=canvasMessage;
  }
}
function normalizeCanvasBase(value){
  const raw=String(value||'').trim();
  if(!raw)throw new Error('Canvas URL is required.');
  const url=new URL(raw);
  if(url.protocol!=='https:')throw new Error('Canvas URL must use HTTPS.');
  return url.origin;
}
function allowedCanvasHosts(env){
  const hosts=new Set(String(env.COURSE_OPS_ALLOWED_CANVAS_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
  if(env.CANVAS_BASE_URL){try{hosts.add(new URL(String(env.CANVAS_BASE_URL)).hostname.toLowerCase());}catch{}}
  return hosts;
}
function canvasConfig(payload,env){
  const base=normalizeCanvasBase(payload.canvasBaseUrl||env.CANVAS_BASE_URL);
  const courseId=String(payload.canvasCourseId||env.CANVAS_COURSE_ID||'').trim();
  const token=String(env.CANVAS_ACCESS_TOKEN||'').trim();
  if(!courseId)throw new Error('Canvas course ID is required.');
  if(!token)throw new Error('Course Ops Canvas credentials are not configured on the service.');
  const allowed=allowedCanvasHosts(env),host=new URL(base).hostname.toLowerCase();
  if(!allowed.size)throw new Error('Course Ops has no approved Canvas host configured.');
  if(!allowed.has(host))throw new Error('This Canvas host is not approved for Course Ops.');
  return{base,courseId,token,host};
}
function canvasHeaders(token){return{Authorization:`Bearer ${token}`,Accept:'application/json'};}
function endpointLabel(url){
  try{return new URL(url).pathname;}catch{return String(url||'Canvas API');}
}
function canvasMessage(body){return String(body?.errors?.[0]?.message||body?.message||body?.error||'').trim();}
async function requestJson(url,init={}){
  const response=await fetch(url,init);const text=await response.text();let body={};
  try{body=text?JSON.parse(text):{};}catch{body={raw:text};}
  if(!response.ok){
    const endpoint=endpointLabel(url),remote=canvasMessage(body);
    if(response.status===401)throw new CanvasRequestError('Canvas rejected the configured access token. Generate or replace the Canvas access token and try again.',{status:401,code:'CANVAS_TOKEN_REJECTED',endpoint,canvasMessage:remote});
    if(response.status===403)throw new CanvasRequestError('Canvas accepted the request but denied access. Confirm that the Canvas account that created this token can open this course and that NKU permits this API action.',{status:403,code:'CANVAS_ACCESS_DENIED',endpoint,canvasMessage:remote});
    if(response.status===404)throw new CanvasRequestError('Canvas could not find the requested course or API resource. Confirm the numeric Canvas course ID and your access to that course.',{status:404,code:'CANVAS_RESOURCE_NOT_FOUND',endpoint,canvasMessage:remote});
    throw new CanvasRequestError(remote||`Canvas request failed (${response.status}).`,{status:response.status,code:'CANVAS_REQUEST_FAILED',endpoint,canvasMessage:remote});
  }
  return{body,response};
}
async function paged(url,token){
  const all=[];let next=url;
  for(let page=0;next&&page<30;page++){
    const {body,response}=await requestJson(next,{headers:canvasHeaders(token)});
    if(Array.isArray(body))all.push(...body);else throw new Error('Canvas returned an unexpected list response.');
    const link=response.headers.get('link')||'';const m=link.match(/<([^>]+)>;\s*rel="next"/);next=m?m[1]:'';
  }
  return all;
}
const enc=v=>encodeURIComponent(String(v));
function courseUrl(c,path=''){return `${c.base}/api/v1/courses/${enc(c.courseId)}${path}`;}
async function diagnoseCanvasAccess(c){
  const {body:profile}=await requestJson(`${c.base}/api/v1/users/self/profile`,{headers:canvasHeaders(c.token)});
  const {body:course}=await requestJson(courseUrl(c),{headers:canvasHeaders(c.token)});
  return{profile,course};
}
async function verifyCourse(payload,env){
  const c=canvasConfig(payload,env);const {profile,course:body}=await diagnoseCanvasAccess(c);
  return{courseId:String(body.id||c.courseId),courseName:String(body.name||body.course_code||'').trim(),courseCode:String(body.course_code||''),canvasHost:c.host,courseUrl:body.html_url||`${c.base}/courses/${enc(c.courseId)}`,authenticatedUserId:String(profile.id||''),diagnostic:'token and course access verified'};
}
function row(type,obj,moduleNames=[]){
  const title=String(obj.title||obj.name||obj.display_name||obj.filename||'Untitled');
  const published=obj.published===true||obj.workflow_state==='available'||obj.workflow_state==='published';
  const explicitlyUnpublished=obj.published===false||obj.workflow_state==='unpublished';
  return{key:`${type}:${obj.id??obj.url??title}`,type,id:String(obj.id??obj.url??''),title,moduleNames,published:explicitlyUnpublished?false:published?true:null,dueAt:obj.due_at||null,unlockAt:obj.unlock_at||obj.delayed_post_at||null,lockAt:obj.lock_at||null,points:Number.isFinite(Number(obj.points_possible))?Number(obj.points_possible):null,updatedAt:obj.updated_at||obj.modified_at||null,htmlUrl:obj.html_url||obj.url||null};
}
async function inspectCourse(payload,env){
  const c=canvasConfig(payload,env);const {profile,course}=await diagnoseCanvasAccess(c);
  const announcementsUrl=`${c.base}/api/v1/announcements?context_codes[]=${encodeURIComponent(`course_${c.courseId}`)}&per_page=100`;
  const [modules,pages,assignments,discussions,files,quizzes,announcements]=await Promise.all([
    paged(courseUrl(c,'/modules?per_page=100'),c.token),paged(courseUrl(c,'/pages?per_page=100'),c.token),paged(courseUrl(c,'/assignments?per_page=100'),c.token),paged(courseUrl(c,'/discussion_topics?per_page=100'),c.token),paged(courseUrl(c,'/files?per_page=100'),c.token),paged(courseUrl(c,'/quizzes?per_page=100'),c.token),paged(announcementsUrl,c.token)
  ]);
  const moduleItems=await Promise.all(modules.map(async m=>({module:m,items:await paged(courseUrl(c,`/modules/${enc(m.id)}/items?per_page=100`),c.token)})));
  const moduleMap=new Map();
  moduleItems.forEach(({module,items})=>items.forEach(i=>{const keys=[];if(i.content_id!=null)keys.push(`${String(i.type||'').toLowerCase()}:${i.content_id}`);if(i.page_url)keys.push(`page:${i.page_url}`);keys.forEach(k=>{const arr=moduleMap.get(k)||[];if(!arr.includes(module.name))arr.push(module.name);moduleMap.set(k,arr);});}));
  const modulesFor=(type,obj)=>{const keys=[`${type.toLowerCase()}:${obj.id}`];if(type==='Page')keys.push(`page:${obj.url}`);return[...new Set(keys.flatMap(k=>moduleMap.get(k)||[]))];};
  const rows=[...modules.map(m=>row('Module',m,[])),...pages.map(x=>row('Page',x,modulesFor('Page',x))),...assignments.map(x=>row('Assignment',x,modulesFor('Assignment',x))),...discussions.map(x=>row('Discussion',x,modulesFor('Discussion',x))),...quizzes.map(x=>row('Quiz',x,modulesFor('Quiz',x))),...files.map(x=>row('File',x,modulesFor('File',x))),...announcements.map(x=>row('Announcement',x,[]))];
  const counts=rows.reduce((out,r)=>(out[r.type]=(out[r.type]||0)+1,out),{});
  return{inspectedAt:new Date().toISOString(),course:{id:String(course.id||c.courseId),name:course.name||course.course_code||'',code:course.course_code||'',url:course.html_url||`${c.base}/courses/${enc(c.courseId)}`,host:c.host},counts,rows,readOnly:true,verification:'fresh Canvas read',authenticatedUserId:String(profile.id||'')};
}

export async function onRequestPost(context){
  try{
    const payload=await context.request.json();const action=String(payload?.action||'');
    if(action==='verifyCourse')return ok(await verifyCourse(payload,context.env));
    if(action==='inspectCourse')return ok(await inspectCourse(payload,context.env));
    return fail(`Unsupported Course Ops action: ${action||'none'}`,404,'UNSUPPORTED_ACTION');
  }catch(error){
    if(error instanceof CanvasRequestError)return fail(error.message,error.status,error.code,{endpoint:error.endpoint,canvasMessage:error.canvasMessage||null});
    return fail(error?.message||error,500,'COURSE_OPS_ERROR');
  }
}
export async function onRequestGet(context){
  const hosts=[...allowedCanvasHosts(context.env)];
  return ok({service:'Course Ops',status:'available',canvasConfigured:Boolean(context.env.CANVAS_ACCESS_TOKEN),approvedCanvasHosts:hosts,readOnly:true,version:'canvas-inspector-2'});
}
