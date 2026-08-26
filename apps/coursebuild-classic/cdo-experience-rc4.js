/* CourseBuild RC4 — Chief Design Officer experience direction */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  const setupKeys=['code','title','institution','credits','defaultDeliveryMode','audience','description','outcomes','policies'];
  const phaseLabels={profile:'Course setup',plan:'Blueprint',review:'Content review',build:'Canvas readiness',versions:'Adapt',settings:'Settings'};

  function hasValue(value){
    return Array.isArray(value)?value.length>0:String(value??'').trim().length>0;
  }

  function courseState(){
    if(typeof data==='undefined')return null;
    const profile=data.profile||{};
    const setupDone=setupKeys.filter(key=>hasValue(profile[key])).length;
    const setupPercent=Math.round((setupDone/setupKeys.length)*100);
    const items=data.items||[];
    const reviewed=items.filter(item=>item.status==='Approved').length;
    const blueprintReady=Boolean((data.modules||[]).length&&items.length);
    const blueprintApproved=data.architecture?.status==='Approved';
    const canvasConnected=typeof settings!=='undefined'&&Boolean(settings?.canvasCourseId&&settings?.canvasBaseUrl&&settings?.appsScriptUrl);
    const milestones=[
      setupPercent===100,
      blueprintApproved,
      items.length>0&&reviewed===items.length,
      canvasConnected
    ];
    const progress=Math.round((milestones.filter(Boolean).length/milestones.length)*100);
    let next={view:'profile',label:'Finish course setup',detail:`${setupDone} of ${setupKeys.length} setup areas complete`};
    if(setupPercent===100&&!blueprintReady)next={view:'plan',label:'Build the course blueprint',detail:'Add source material, then generate or shape the course map'};
    else if(setupPercent===100&&blueprintReady&&!blueprintApproved)next={view:'plan',label:'Review and approve blueprint',detail:`${data.modules.length} modules · ${items.length} course items`};
    else if(blueprintApproved&&reviewed<items.length)next={view:'review',label:'Review generated content',detail:`${reviewed} of ${items.length} course items approved`};
    else if(blueprintApproved&&items.length&&reviewed===items.length&&!canvasConnected)next={view:'settings',label:'Connect Canvas',detail:'Add the connection details required for publishing'};
    else if(blueprintApproved&&items.length&&reviewed===items.length&&canvasConnected)next={view:'build',label:'Run Canvas preflight',detail:'Confirm the course is ready before anything is published'};
    return {profile,setupDone,setupPercent,items,reviewed,blueprintReady,blueprintApproved,canvasConnected,progress,next};
  }

  function activeView(){
    return q('.view:not(.hidden)')?.id||null;
  }

  function jump(view){
    q(`.steps button[data-view="${view}"]`)?.click();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function commandMarkup(state,current){
    const title=state.profile.title||'Untitled course';
    const code=state.profile.code||'Course';
    const isNext=current===state.next.view;
    return `<section class="cdo-command" aria-label="Course progress and next action">
      <div class="cdo-command-course"><span>Building now</span><strong>${escapeHtml(code)} · ${escapeHtml(title)}</strong></div>
      <div class="cdo-command-progress"><span>Course progress</span><div><strong>${state.progress}%</strong><i aria-hidden="true"><b style="width:${state.progress}%"></b></i></div></div>
      <div class="cdo-command-next"><span>${isNext?'Focus now':'Recommended next'}</span><strong>${escapeHtml(state.next.label)}</strong><small>${escapeHtml(state.next.detail)}</small></div>
      <button class="primary cdo-command-action" data-cdo-jump="${state.next.view}">${isNext?'Continue here':'Go to '+escapeHtml(phaseLabels[state.next.view]||'next step')} →</button>
    </section>`;
  }

  function enhanceCurrentView(){
    const state=courseState();
    const current=activeView();
    document.body.classList.toggle('cdo-blueprint-active',current==='plan');
    if(!state||!current||current==='projects')return;
    const host=q(`#${current}`);
    if(!host)return;
    q('.cdo-command',host)?.remove();
    const head=q('.section-head',host);
    if(!head)return;
    head.insertAdjacentHTML('afterend',commandMarkup(state,current));
    q('[data-cdo-jump]',host)?.addEventListener('click',e=>jump(e.currentTarget.dataset.cdoJump));
    if(current==='plan')enhanceBlueprint(host,state);
    if(current==='build')enhanceReadiness(host,state);
  }

  function enhanceBlueprint(host,state){
    let note=q('.cdo-blueprint-directive',host);
    if(!note){
      const workspace=q('.rc3-blueprint-workspace',host);
      if(!workspace)return;
      workspace.insertAdjacentHTML('beforebegin',`<div class="cdo-blueprint-directive"><div><span>Your course map</span><strong>See the whole course. Change the details without losing the structure.</strong></div><p>Modules and course items stay visible together so you can make instructional decisions in context.</p></div>`);
      note=q('.cdo-blueprint-directive',host);
    }
    note?.classList.toggle('approved',state.blueprintApproved);
  }

  function enhanceReadiness(host,state){
    q('.cdo-trust-panel',host)?.remove();
    const target=q('.rc3-advanced-build',host);
    if(!target)return;
    const ready=state.blueprintApproved&&state.items.length>0&&state.reviewed===state.items.length&&state.canvasConnected;
    target.insertAdjacentHTML('beforebegin',`<section class="cdo-trust-panel ${ready?'ready':''}">
      <div><span>Before anything changes in Canvas</span><h3>${ready?'You remain in control.':'CourseBuild will stop before publish until the course is ready.'}</h3></div>
      <ul><li><strong>Check first</strong><span>Readiness issues are surfaced before publishing.</span></li><li><strong>Preview the change</strong><span>Publish controls stay behind an explicit preview step.</span></li><li><strong>Protect existing work</strong><span>CourseBuild does not silently delete existing Canvas content.</span></li></ul>
    </section>`);
  }

  function emphasizeBlueprintNav(){
    const button=q('.steps button[data-view="plan"]');
    if(!button)return;
    button.classList.add('cdo-blueprint-nav');
    button.setAttribute('title','Blueprint — your visual course map');
  }

  let scheduled=false;
  function scheduleEnhance(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      enhanceCurrentView();
    });
  }

  function install(){
    emphasizeBlueprintNav();
    scheduleEnhance();
    document.addEventListener('click',event=>{
      if(event.target.closest('.steps button[data-view], .mobile-section-nav select, [data-rc3-open], [data-rc3-continue], [data-rc3-check]'))setTimeout(scheduleEnhance,0);
    });
    document.addEventListener('change',event=>{
      if(event.target.matches('input,textarea,select'))setTimeout(scheduleEnhance,80);
    });
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='attributes'&&m.attributeName==='class'))scheduleEnhance();
    });
    qa('.view').forEach(view=>observer.observe(view,{attributes:true,attributeFilter:['class']}));
  }

  window.addEventListener('load',()=>setTimeout(install,120));
})();
