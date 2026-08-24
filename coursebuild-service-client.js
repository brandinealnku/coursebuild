/* CourseBuild 1.0 signature-journey service client. Keeps provider/LMS secrets off the browser. */
(function(){
  const ENDPOINT='/api/coursebuild';
  const q=(s,r=document)=>r.querySelector(s);
  const safe=v=>esc(v??'');
  let health={state:'Checking',generationConfigured:false,canvasConfigured:false,error:''};

  async function callService(action,payload={}){
    const response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({action,course:data.profile,canvasCourseId:settings.canvasCourseId||'',canvasBaseUrl:settings.canvasBaseUrl||'',architectureApproved:data.architecture?.status==='Approved',...payload})});
    const body=await response.json().catch(()=>({ok:false,error:'CourseBuild service did not return JSON.'}));
    if(!response.ok||body.ok===false)throw new Error(body.error||`CourseBuild service request failed (${response.status}).`);
    return body.data||body;
  }

  window.api=callService;

  async function checkHealth(){
    try{const out=await callService('serviceHealth');health={state:'Available',generationConfigured:Boolean(out.generationConfigured),canvasConfigured:Boolean(out.canvasConfigured),error:'',version:out.version||''};}
    catch(e){health={state:'Unavailable',generationConfigured:false,canvasConfigured:false,error:e.message||'CourseBuild service unavailable.'};}
    settings.coursebuildService={...health,checkedAt:new Date().toISOString()};saveSettings();window.dispatchEvent(new CustomEvent('coursebuild:service-health',{detail:health}));return health;
  }
  function serviceHealth(){return health.state==='Checking'&&settings.coursebuildService?settings.coursebuildService:health;}
  function generationReady(){return serviceHealth().state==='Available'&&serviceHealth().generationConfigured===true;}

  function renderServiceSettings(){
    const host=q('#settings');if(!host)return;
    const M=window.CourseBuildTrustModel;const v=M?.normalizedCanvasVerification?.(settings)||settings.canvasVerification||{state:'Not configured'};const configured=Boolean(settings.canvasBaseUrl&&settings.canvasCourseId);const h=serviceHealth();
    const serviceMessage=h.state==='Available'?`CourseBuild service available${h.generationConfigured?' · AI generation ready':' · AI generation not configured'}${h.canvasConfigured?' · Canvas credential available':' · Canvas credential not configured'}`:h.state==='Checking'?'Checking CourseBuild service…':`CourseBuild service unavailable: ${safe(h.error||'Unknown error')}`;
    const destination=v.state==='Connected and verified'?`<p role="status"><strong>Verified destination:</strong> ${safe(v.courseName)} · Course ${safe(v.courseId)}${v.verifiedAt?` · ${safe(new Date(v.verifiedAt).toLocaleString())}`:''}</p>`:'';
    const error=v.state==='Connection failed'?`<p role="alert"><strong>Connection failed:</strong> ${safe(v.error)}</p>`:'';
    host.innerHTML=`<div class="section-head"><div><p class="eyebrow">Connections</p><h2>CourseBuild service + Canvas</h2><p>CourseBuild keeps AI and Canvas credentials on the service. You only identify the Canvas destination here.</p></div>${badge(v.state)}</div><section class="panel"><h3>CourseBuild service</h3><p id="cbServiceHealth" role="status">${serviceMessage}</p><button type="button" id="cbCheckService">Check service</button></section><form id="settingsForm" class="panel form"><label>Canvas Base URL<input name="canvasBaseUrl" placeholder="https://yourinstitution.instructure.com" value="${safe(settings.canvasBaseUrl||'')}"></label><label>Canvas Course ID<input name="canvasCourseId" inputmode="numeric" value="${safe(settings.canvasCourseId||'')}"></label>${destination}${error}<div class="actions"><button type="submit">Save destination</button><button type="button" id="verifyCanvasBtn" class="primary" ${!configured||h.state!=='Available'||!h.canvasConfigured?'disabled':''}>Verify Canvas connection</button></div><p class="hint">A saved destination is not treated as connected until CourseBuild reads the actual Canvas course identity.</p></form>`;
    q('#settingsForm',host).onsubmit=e=>{e.preventDefault();const previous={canvasBaseUrl:settings.canvasBaseUrl||'',canvasCourseId:settings.canvasCourseId||''};const next=Object.fromEntries(new FormData(e.currentTarget).entries());settings={...settings,...next};delete settings.appsScriptUrl;const changed=previous.canvasBaseUrl!==settings.canvasBaseUrl||previous.canvasCourseId!==settings.canvasCourseId;if(changed)settings.canvasVerification={};saveSettings();renderAll();toast('Canvas destination saved. Verify it before using live Canvas operations.');};
    q('#verifyCanvasBtn',host)?.addEventListener('click',()=>window.verifyCanvasConnection?.());
    q('#cbCheckService',host)?.addEventListener('click',async()=>{health={...health,state:'Checking'};renderServiceSettings();await checkHealth();renderServiceSettings();});
  }

  function install(){
    delete settings.appsScriptUrl;saveSettings();
    window.CourseBuildService={endpoint:ENDPOINT,call:callService,checkHealth,health:serviceHealth,generationReady};
    window.renderSettings=renderServiceSettings;
    checkHealth().finally(()=>{try{renderServiceSettings();window.renderPlan?.();window.CourseBuildCommandCenter?.render?.();}catch(e){}});
  }
  window.addEventListener('load',()=>setTimeout(install,50));
})();
