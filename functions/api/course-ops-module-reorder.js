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
function canvasHeaders(token,extra={}){return{Authorization:`Bearer ${token}`,Accept:'application/json',...extra};}
function endpointLabel(url){try{return new URL(url).pathname;}catch{return String(url||'Canvas API');}}
function canvasMessage(body){return String(body?.errors?.[0]?.message||body?.message||body?.error||'').trim();}
async function requestJson(url,init={}){
  const response=await fetch(url,init);const text=await response.text();let body={};
  try{body=text?JSON.parse(text):{};}catch{body={raw:text};}
  if(!response.ok){
    const endpoint=endpointLabel(url),remote=canvasMessage(body);
    if(response.status===401)throw new CanvasRequestError('Canvas rejected the configured access token.',{status:401,code:'CANVAS_TOKEN_REJECTED',endpoint,canvasMessage:remote});
    if(response.status===403)throw new CanvasRequestError('Canvas denied this module reorder request. Confirm that the Canvas account that created this token can edit modules in this course and that NKU permits this API action.',{status:403,code:'CANVAS_ACCESS_DENIED',endpoint,canvasMessage:remote});
    if(response.status===404)throw new CanvasRequestError('Canvas could not find the requested course or module.',{status:404,code:'CANVAS_RESOURCE_NOT_FOUND',endpoint,canvasMessage:remote});
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
async function listModules(c){return paged(courseUrl(c,'/modules?per_page=100'),c.token);}
function moduleSnapshot(module,index){return{id:String(module.id),name:String(module.name||''),position:Number(module.position||index+1),index:index+1,published:module.published===true};}

async function reorderModule(payload,env){
  const c=canvasConfig(payload,env);
  const moduleId=String(payload.moduleId||'').trim();
  if(!moduleId)throw new Error('Canvas module ID is required.');
  if(payload.confirmWrite!==true)throw new Error('Explicit confirmWrite=true is required for a Canvas module reorder.');

  const before=await listModules(c);
  if(!before.length)throw new Error('This Canvas course has no modules to reorder.');
  const beforeIndex=before.findIndex(m=>String(m.id)===moduleId);
  if(beforeIndex<0)throw new CanvasRequestError('The requested Canvas module was not found in this course.',{status:404,code:'CANVAS_RESOURCE_NOT_FOUND',endpoint:courseUrl(c,`/modules/${enc(moduleId)}`)});

  let desiredPosition;
  if(String(payload.position||'').toLowerCase()==='bottom')desiredPosition=before.length;
  else{
    desiredPosition=Number(payload.position);
    if(!Number.isInteger(desiredPosition)||desiredPosition<1||desiredPosition>before.length)throw new Error(`position must be "bottom" or an integer from 1 to ${before.length}.`);
  }

  const targetBefore=moduleSnapshot(before[beforeIndex],beforeIndex);
  const alreadyThere=desiredPosition===beforeIndex+1;
  if(!alreadyThere){
    const body=new URLSearchParams();body.set('module[position]',String(desiredPosition));
    await requestJson(courseUrl(c,`/modules/${enc(moduleId)}`),{
      method:'PUT',
      headers:canvasHeaders(c.token,{'content-type':'application/x-www-form-urlencoded;charset=UTF-8'}),
      body:body.toString()
    });
  }

  const after=await listModules(c);
  const afterIndex=after.findIndex(m=>String(m.id)===moduleId);
  if(afterIndex<0)throw new Error('Canvas accepted the request, but the module disappeared from the refreshed module list.');
  const targetAfter=moduleSnapshot(after[afterIndex],afterIndex);
  const verified=afterIndex+1===desiredPosition;
  if(!verified)throw new Error(`Canvas returned a refreshed module order, but verification failed. Expected position ${desiredPosition}; observed ${afterIndex+1}.`);

  return{
    changed:!alreadyThere,
    verified:true,
    verification:'fresh Canvas read after write',
    requestedPosition:desiredPosition,
    before:targetBefore,
    after:targetAfter,
    moduleCount:after.length,
    courseId:c.courseId,
    canvasHost:c.host
  };
}

export async function onRequestPost(context){
  try{
    const payload=await context.request.json();
    const action=String(payload?.action||'reorderModule');
    if(action!=='reorderModule')return fail(`Unsupported Course Ops module action: ${action||'none'}`,404,'UNSUPPORTED_ACTION');
    return ok(await reorderModule(payload,context.env));
  }catch(error){
    if(error instanceof CanvasRequestError)return fail(error.message,error.status,error.code,{endpoint:error.endpoint,canvasMessage:error.canvasMessage||null});
    return fail(error?.message||error,500,'COURSE_OPS_MODULE_REORDER_ERROR');
  }
}

export async function onRequestGet(){
  return ok({service:'Course Ops module reorder pilot',status:'available',writeAction:'reorderModule',requiresExplicitConfirmation:true,schedule:false,verification:'fresh Canvas read after write'});
}
