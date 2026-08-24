const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const ok=data=>json({ok:true,data});
const fail=(error,status=400,code="REQUEST_FAILED")=>json({ok:false,error:String(error||"CourseBuild request failed."),code},status);
const cleanBase=v=>String(v||"").trim().replace(/\/+$/,'');
const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const marker=key=>`<span data-coursebuild-key="${escHtml(key)}" style="display:none">CourseBuild:${escHtml(key)}</span>`;

async function requestJson(url,init={}){
  const r=await fetch(url,init);const text=await r.text();let body={};
  try{body=text?JSON.parse(text):{};}catch{body={raw:text};}
  if(!r.ok)throw new Error(body?.errors?.[0]?.message||body?.message||body?.error||`Request failed (${r.status}).`);
  return body;
}
function canvasConfig(payload,env){
  const base=cleanBase(payload.canvasBaseUrl||env.CANVAS_BASE_URL),courseId=String(payload.canvasCourseId||env.CANVAS_COURSE_ID||'').trim(),token=String(env.CANVAS_ACCESS_TOKEN||'').trim();
  if(!base||!courseId)throw new Error('Canvas URL and course ID are required.');
  if(!token)throw new Error('CourseBuild Canvas credentials are not configured on the service.');
  return{base,courseId,token};
}
function canvasHeaders(token,extra={}){return{Authorization:`Bearer ${token}`,Accept:'application/json',...extra};}
async function canvasJson(payload,env,path,init={}){
  const c=canvasConfig(payload,env);return requestJson(`${c.base}/api/v1/courses/${encodeURIComponent(c.courseId)}${path}`,{...init,headers:canvasHeaders(c.token,init.headers||{})});
}
async function pagedCanvas(payload,env,path){
  const c=canvasConfig(payload,env);let url=`${c.base}/api/v1/courses/${encodeURIComponent(c.courseId)}${path}${path.includes('?')?'&':'?'}per_page=100`,all=[];
  for(let page=0;url&&page<20;page++){
    const r=await fetch(url,{headers:canvasHeaders(c.token)});if(!r.ok){const t=await r.text();throw new Error(t||`Canvas read failed (${r.status}).`);}const batch=await r.json();all=all.concat(Array.isArray(batch)?batch:[]);
    const link=r.headers.get('link')||'';const m=link.match(/<([^>]+)>;\s*rel="next"/);url=m?m[1]:'';
  }
  return all;
}
function parseGeminiText(body){
  const text=body?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();if(!text)throw new Error('Generation service returned no content.');
  const cleaned=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();return JSON.parse(cleaned);
}
async function gemini(env,prompt){
  const key=String(env.GEMINI_API_KEY||'').trim();if(!key)throw new Error('CourseBuild generation service is not configured.');
  const model=String(env.GEMINI_MODEL||'gemini-2.5-flash').trim();
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2,responseMimeType:'application/json'}})});
  const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body?.error?.message||`Generation service failed (${r.status}).`);return parseGeminiText(body);
}
function architecturePrompt(payload){
  const course=payload.course||{},source=String(payload.sourceText||'').slice(0,50000);
  return `You are CourseBuild, an instructor-controlled course-production system. Use ONLY the supplied source material. Do not invent dates, policies, assessments, learning outcomes, or requirements that are not supported by the source. Return JSON only with keys modules, items, sourceDigest. modules is an array of {title,summary}. items is an array of {moduleOrder,type,title,purpose,points}. Allowed item types: Page, Assignment, Discussion, File, Quiz. Use 0 points unless points are explicit or the item is clearly ungraded. Every item must have a purpose grounded in the source. This is a proposal for instructor review, not an approved course.\n\nCourse context: ${JSON.stringify(course)}\n\nSOURCE MATERIAL:\n${source}`;
}
function itemPrompt(payload){
  const item=payload.item||{},module=payload.module||{},outcomes=payload.outcomes||[],source=String(payload.sourceText||'').slice(0,30000);
  return `Create a draft for an instructor to review. Ground it in the supplied source and course context. Do not claim facts, dates, readings, policies, or requirements not supported by the source. Return JSON only: {"draftHtml":"..."}. Use accessible semantic HTML with headings, paragraphs, and lists as appropriate. Do not include scripts or external embeds.\nItem: ${JSON.stringify(item)}\nModule: ${JSON.stringify(module)}\nLearning outcomes: ${JSON.stringify(outcomes)}\nSOURCE:\n${source}`;
}
async function verifyCanvasConnection(payload,env){
  const c=canvasConfig(payload,env);const out=await requestJson(`${c.base}/api/v1/courses/${encodeURIComponent(c.courseId)}`,{headers:canvasHeaders(c.token)});
  return{courseId:String(out.id||''),courseName:String(out.name||out.course_code||'').trim(),courseUrl:out.html_url||`${c.base}/courses/${c.courseId}`};
}
async function getCanvasCourseOverview(payload,env){
  const c=canvasConfig(payload,env);const [course,pages,assignments,discussions,files,quizzes]=await Promise.all([
    requestJson(`${c.base}/api/v1/courses/${encodeURIComponent(c.courseId)}`,{headers:canvasHeaders(c.token)}),
    pagedCanvas(payload,env,'/pages'),pagedCanvas(payload,env,'/assignments'),pagedCanvas(payload,env,'/discussion_topics'),pagedCanvas(payload,env,'/files'),pagedCanvas(payload,env,'/quizzes')
  ]);
  const unpublished=[...pages,...assignments,...discussions,...files,...quizzes].filter(x=>x.published===false||x.workflow_state==='unpublished').length;
  return{courseId:String(course.id||c.courseId),courseName:course.name||course.course_code||'',counts:{Page:pages.length,Assignment:assignments.length,Discussion:discussions.length,File:files.length,Quiz:quizzes.length},unpublished};
}
function formBody(fields){const p=new URLSearchParams();Object.entries(fields).forEach(([k,v])=>{if(v!==undefined&&v!==null)p.set(k,String(v));});return p.toString();}
async function publishItem(payload,env){
  const item=payload.item||{},type=String(item.type||''),key=String(payload.coursebuildKey||item.coursebuildKey||''),existing=String(payload.existingCanvasId||'').trim();
  if(!key)throw new Error('Stable CourseBuild key is required for publishing.');
  if(type==='File')throw new Error('File publishing requires an uploaded binary file. CourseBuild will not create a placeholder Canvas File.');
  const bodyHtml=`${marker(key)}${String(item.draftHtml||item.purpose||'')}`;
  let path='',method=existing?'PUT':'POST',fields={};
  if(type==='Page'){path=existing?`/pages/${encodeURIComponent(existing)}`:'/pages';fields={'wiki_page[title]':item.title,'wiki_page[body]':bodyHtml,'wiki_page[published]':'true'};}
  else if(type==='Assignment'){path=existing?`/assignments/${encodeURIComponent(existing)}`:'/assignments';fields={'assignment[name]':item.title,'assignment[description]':bodyHtml,'assignment[points_possible]':Number(item.points||0),'assignment[published]':'true'};}
  else if(type==='Discussion'){path=existing?`/discussion_topics/${encodeURIComponent(existing)}`:'/discussion_topics';fields={title:item.title,message:bodyHtml,published:'true'};}
  else if(type==='Quiz'){path=existing?`/quizzes/${encodeURIComponent(existing)}`:'/quizzes';fields={'quiz[title]':item.title,'quiz[description]':bodyHtml,'quiz[quiz_type]':'assignment','quiz[published]':'true'};}
  else throw new Error(`Canvas publishing is not implemented for item type ${type||'unknown'}.`);
  const out=await canvasJson(payload,env,path,{method,headers:{'content-type':'application/x-www-form-urlencoded;charset=UTF-8'},body:formBody(fields)});
  const canvasId=String(type==='Page'?(out.url||out.page_id||out.id||''):(out.id||''));if(!canvasId)throw new Error('Canvas publish returned no object identity.');
  const c=canvasConfig(payload,env);return{canvasId,canvasUrl:out.html_url||out.url&&type!=='Page'?out.url:type==='Page'?`${c.base}/courses/${c.courseId}/pages/${encodeURIComponent(canvasId)}`:''};
}
async function verifyPublishedItem(payload,env){
  const item=payload.item||{},type=String(item.type||''),id=String(payload.canvasId||'').trim(),key=String(payload.expectedCoursebuildKey||item.coursebuildKey||'');if(!id)throw new Error('Canvas object identity is required for verification.');
  let path='';if(type==='Page')path=`/pages/${encodeURIComponent(id)}`;else if(type==='Assignment')path=`/assignments/${encodeURIComponent(id)}`;else if(type==='Discussion')path=`/discussion_topics/${encodeURIComponent(id)}`;else if(type==='Quiz')path=`/quizzes/${encodeURIComponent(id)}`;else throw new Error(`Read-back verification is not implemented for ${type||'unknown'}.`);
  const out=await canvasJson(payload,env,path);const title=String(out.title||out.name||'').trim();const content=String(out.body||out.description||out.message||'');const matches=title===String(payload.expectedTitle||item.title||'').trim()&&(!key||content.includes(`data-coursebuild-key="${key.replace(/"/g,'&quot;')}"`)||content.includes(`CourseBuild:${key}`));
  return{matches,canvasId:id,coursebuildKey:key,type,title,canvasUrl:out.html_url||''};
}

export async function onRequestPost(context){
  try{
    const payload=await context.request.json();const action=String(payload?.action||'');const env=context.env;
    if(action==='serviceHealth')return ok({service:'CourseBuild',generationConfigured:Boolean(env.GEMINI_API_KEY),canvasConfigured:Boolean(env.CANVAS_ACCESS_TOKEN),version:'signature-journey-1'});
    if(action==='generateCourseArchitecture')return ok(await gemini(env,architecturePrompt(payload)));
    if(action==='generateItem')return ok(await gemini(env,itemPrompt(payload)));
    if(action==='verifyCanvasConnection')return ok(await verifyCanvasConnection(payload,env));
    if(action==='getCanvasCourseOverview')return ok(await getCanvasCourseOverview(payload,env));
    if(action==='publishItem')return ok(await publishItem(payload,env));
    if(action==='verifyPublishedItem')return ok(await verifyPublishedItem(payload,env));
    return fail(`Unsupported CourseBuild service action: ${action||'none'}`,404,'UNSUPPORTED_ACTION');
  }catch(e){return fail(e?.message||e,500,'SERVICE_ERROR');}
}

export async function onRequestGet(context){return ok({service:'CourseBuild',status:'available',generationConfigured:Boolean(context.env.GEMINI_API_KEY),canvasConfigured:Boolean(context.env.CANVAS_ACCESS_TOKEN),version:'signature-journey-1'});}
