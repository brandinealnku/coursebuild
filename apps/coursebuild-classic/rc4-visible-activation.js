/* CourseBuild RC4 visible activation — make product direction unmistakable */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const setupKeys=['code','title','institution','credits','defaultDeliveryMode','audience','description','outcomes','policies'];

  function state(){
    if(typeof data==='undefined')return null;
    const p=data.profile||{};
    const filled=setupKeys.filter(k=>Array.isArray(p[k])?p[k].length:String(p[k]??'').trim()).length;
    const setup=Math.round((filled/setupKeys.length)*100);
    const items=data.items||[];
    const reviewed=items.filter(i=>i.status==='Approved').length;
    const blueprint=Boolean(data.architecture?.status==='Approved');
    const canvas=typeof settings!=='undefined'&&(
      window.CourseBuildTrustModel?.isCanvasVerified
        ? window.CourseBuildTrustModel.isCanvasVerified(settings)
        : Boolean(settings?.canvasVerification?.state==='Connected and verified')
    );
    const stages=[setup===100,blueprint,items.length>0&&reviewed===items.length,canvas];
    const progress=Math.round((stages.filter(Boolean).length/stages.length)*100);
    let next={view:'profile',label:'Finish course setup',detail:`${filled} of ${setupKeys.length} setup areas complete`};
    if(setup===100&&!blueprint)next={view:'plan',label:'Shape and approve the Blueprint',detail:`${data.modules?.length||0} modules · ${items.length} course items`};
    else if(blueprint&&reviewed<items.length)next={view:'review',label:'Review course content',detail:`${reviewed} of ${items.length} course items approved`};
    else if(blueprint&&items.length&&reviewed===items.length&&!canvas)next={view:'settings',label:'Connect and verify Canvas',detail:'Verify the Canvas destination before publishing'};
    else if(blueprint&&items.length&&reviewed===items.length&&canvas)next={view:'build',label:'Run Canvas preflight',detail:'Confirm exactly what is ready before publishing'};
    return {p,setup,items,reviewed,blueprint,canvas,progress,next};
  }

  function jump(view){
    q(`.steps button[data-view="${view}"]`)?.click();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function stage(label,ok,active){
    return `<div class="rc4-stage ${ok?'done':''} ${active?'active':''}"><i>${ok?'✓':'•'}</i><span>${esc(label)}</span></div>`;
  }

  function renderHome(){
    const host=q('#projects');
    const s=state();
    if(!host||!s)return;
    q('.rc4-home-command',host)?.remove();
    const head=q('.section-head',host);
    if(!head)return;
    const active=s.next.view;
    head.insertAdjacentHTML('afterend',`<section class="rc4-home-command" aria-label="CourseBuild command center">
      <div class="rc4-home-main">
        <div class="rc4-home-kicker"><span>CourseBuild</span><em>Build once. Adapt everywhere.</em></div>
        <h3>${esc(s.p.code||'Your course')} ${s.p.title?`· ${esc(s.p.title)}`:''}</h3>
        <p>See the course taking shape, know what needs attention, and move forward without hunting through the product.</p>
        <div class="rc4-home-progress"><div><strong>${s.progress}%</strong><span>course ready</span></div><i><b style="width:${s.progress}%"></b></i></div>
      </div>
      <aside class="rc4-home-next">
        <span>Recommended next</span>
        <h4>${esc(s.next.label)}</h4>
        <p>${esc(s.next.detail)}</p>
        <button class="primary" data-rc4-next="${s.next.view}">Continue →</button>
      </aside>
      <div class="rc4-stage-rail" aria-label="Course workflow">
        ${stage('Setup',s.setup===100,active==='profile')}
        ${stage('Blueprint',s.blueprint,active==='plan')}
        ${stage('Review',s.items.length>0&&s.reviewed===s.items.length,active==='review')}
        ${stage('Canvas',s.canvas,active==='settings'||active==='build')}
      </div>
    </section>`);
    q('[data-rc4-next]',host)?.addEventListener('click',e=>jump(e.currentTarget.dataset.rc4Next));
  }

  function markBuild(){
    const tag=q('.topbar .tag');
    if(tag){tag.textContent='CourseBuild · Build once. Adapt everywhere.';tag.removeAttribute('aria-hidden');}
    document.documentElement.dataset.coursebuildBuild='home-command-center';
  }

  function render(){
    markBuild();
    renderHome();
  }

  window.addEventListener('load',()=>setTimeout(render,180));
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-view="projects"], [data-rc3-open], #projectSwitcher'))setTimeout(render,80);
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('#projectSwitcher'))setTimeout(render,100);
  });
})();
