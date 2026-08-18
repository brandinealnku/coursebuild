/* CourseBuild RC5 — Executive Product Follow-Up / experience debt payoff */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const setupKeys=['code','title','institution','credits','defaultDeliveryMode','audience','description','outcomes','policies'];

  function state(){
    if(typeof data==='undefined')return null;
    const p=data.profile||{};
    const filled=setupKeys.filter(k=>Array.isArray(p[k])?p[k].length:String(p[k]??'').trim()).length;
    const setup=Math.round((filled/setupKeys.length)*100);
    const modules=data.modules||[];
    const items=data.items||[];
    const reviewed=items.filter(i=>i.status==='Approved').length;
    const needsReview=items.filter(i=>i.status!=='Approved').length;
    const blueprintApproved=data.architecture?.status==='Approved';
    const canvasConnected=typeof settings!=='undefined'&&Boolean(settings?.canvasCourseId&&settings?.canvasBaseUrl&&settings?.appsScriptUrl);
    const attention=[];
    if(setup<100)attention.push({view:'profile',label:'Course setup',detail:`${filled} of ${setupKeys.length} areas complete`});
    if(!modules.length||!items.length)attention.push({view:'plan',label:'Blueprint',detail:'Course structure still needs to be created'});
    else if(!blueprintApproved)attention.push({view:'plan',label:'Blueprint',detail:'Review and approve the proposed course structure'});
    if(items.length&&needsReview)attention.push({view:'review',label:'Content review',detail:`${needsReview} item${needsReview===1?'':'s'} need review`});
    if(blueprintApproved&&items.length&&!needsReview&&!canvasConnected)attention.push({view:'settings',label:'Canvas connection',detail:'Connect Canvas before preflight'});
    let next=attention[0]||{view:'build',label:'Canvas preflight',detail:'Review exactly what is ready before publishing'};
    return {p,filled,setup,modules,items,reviewed,needsReview,blueprintApproved,canvasConnected,attention,next};
  }

  function jump(view){q(`.steps button[data-view="${view}"]`)?.click();window.scrollTo({top:0,behavior:'smooth'});}

  function blueprintMini(s){
    const modules=s.modules.slice(0,5).map((m,idx)=>{
      const count=s.items.filter(i=>i.moduleId===m.id).length;
      const incomplete=s.items.filter(i=>i.moduleId===m.id&&i.status!=='Approved').length;
      return `<button class="rc5-map-module" data-rc5-map="plan" title="Open Blueprint"><i>${String(idx+1).padStart(2,'0')}</i><span><strong>${esc(m.title||`Module ${idx+1}`)}</strong><small>${count} item${count===1?'':'s'}${incomplete?` · ${incomplete} need attention`:''}</small></span><em>${incomplete?'Review':'Ready'}</em></button>`;
    }).join('');
    return modules||'<div class="rc5-map-empty"><strong>No Blueprint yet</strong><span>Add source material or create the first module.</span></div>';
  }

  function homeExperience(){
    const host=q('#projects'),s=state();if(!host||!s)return;
    q('.rc5-home',host)?.remove();
    const old=q('.rc4-home-command',host);if(old)old.hidden=true;
    const head=q('.section-head',host);if(!head)return;
    const attentionCount=s.attention.length;
    head.insertAdjacentHTML('afterend',`<section class="rc5-home" aria-label="Current course workspace">
      <div class="rc5-home-primary">
        <div class="rc5-kicker"><span>Current course</span><em>RC5 · Experience debt payoff</em></div>
        <h3>${esc(s.p.title||'Untitled course')}</h3>
        <p class="rc5-course-code">${esc(s.p.code||'Course')} ${s.p.institution?`· ${esc(s.p.institution)}`:''}</p>
        <div class="rc5-next">
          <span>What needs your attention</span>
          <strong>${esc(s.next.label)}</strong>
          <p>${esc(s.next.detail)}</p>
          <button class="primary" data-rc5-next="${s.next.view}">Continue →</button>
        </div>
      </div>
      <div class="rc5-home-blueprint">
        <header><div><span>The course</span><h4>Blueprint</h4></div><button data-rc5-map="plan">Open Blueprint →</button></header>
        <div class="rc5-map">${blueprintMini(s)}</div>
      </div>
      <aside class="rc5-home-status">
        <div><span>Needs attention</span><strong>${attentionCount}</strong></div>
        <ul>
          <li class="${s.setup===100?'done':''}"><i>${s.setup===100?'✓':'•'}</i><span>Setup</span></li>
          <li class="${s.blueprintApproved?'done':''}"><i>${s.blueprintApproved?'✓':'•'}</i><span>Blueprint</span></li>
          <li class="${s.items.length&&!s.needsReview?'done':''}"><i>${s.items.length&&!s.needsReview?'✓':'•'}</i><span>Review</span></li>
          <li class="${s.canvasConnected?'done':''}"><i>${s.canvasConnected?'✓':'•'}</i><span>Canvas</span></li>
        </ul>
      </aside>
    </section>`);
    qa('[data-rc5-next],[data-rc5-map]',host).forEach(b=>b.onclick=()=>jump(b.dataset.rc5Next||b.dataset.rc5Map));
    simplifyCourseCards(host);
  }

  function simplifyCourseCards(host){
    qa('.rc3-course-card',host).forEach(card=>{
      card.classList.add('rc5-course-card');
      const active=card.classList.contains('active');
      card.classList.toggle('rc5-secondary-course',!active);
      const meta=q('.rc3-course-meta',card);if(meta)meta.hidden=!active;
      const progress=q('.rc3-progress',card);if(progress)progress.hidden=!active;
    });
  }

  function addTrustBar(){
    const current=q('.view:not(.hidden)');const s=state();if(!current||!s||current.id==='projects')return;
    q('.rc5-trust-bar',current)?.remove();
    const head=q('.section-head',current);if(!head)return;
    const canvas=s.canvasConnected?'Canvas connected':'Canvas unchanged';
    const blueprint=s.blueprintApproved?'Blueprint approved':'Blueprint draft';
    head.insertAdjacentHTML('afterend',`<div class="rc5-trust-bar" role="status"><span><i></i>Saved locally</span><span>${esc(blueprint)}</span><span>${esc(canvas)}</span></div>`);
  }

  function progressiveBlueprint(){
    const host=q('#plan'),s=state();if(!host||!s)return;
    q('.rc5-blueprint-intro',host)?.remove();
    const workspace=q('.rc3-blueprint-workspace',host);if(!workspace)return;
    workspace.insertAdjacentHTML('beforebegin',`<section class="rc5-blueprint-intro"><div><span>The course is the interface</span><h3>See the structure first. Open detail only when you need it.</h3><p>${s.modules.length} modules · ${s.items.length} course items · ${s.needsReview} needing attention</p></div><div class="rc5-blueprint-state"><strong>${s.blueprintApproved?'Approved':'Draft'}</strong><span>${s.blueprintApproved?'Changes will reset approval.':'Review the structure before approving.'}</span></div></section>`);
    const source=q('.rc3-source',host);
    if(source&&s.modules.length){
      source.classList.add('rc5-secondary-source');
      if(!q('.rc5-source-toggle',source)){
        source.insertAdjacentHTML('afterbegin','<button type="button" class="rc5-source-toggle" aria-expanded="false">Source & regeneration options <span>Show</span></button>');
        q('.rc5-source-toggle',source).onclick=e=>{
          const open=source.classList.toggle('open');
          e.currentTarget.setAttribute('aria-expanded',String(open));
          q('span',e.currentTarget).textContent=open?'Hide':'Show';
        };
      }
    }
  }

  function clarifyAI(){
    const host=q('#review');if(!host)return;
    qa('.card,.panel,article',host).forEach(card=>{
      const text=card.textContent||'';
      if(/generated|ai|draft/i.test(text)&&!q('.rc5-ai-label',card)){
        card.insertAdjacentHTML('afterbegin','<div class="rc5-ai-label"><span>AI-assisted draft</span><em>You decide what becomes course content.</em></div>');
      }
    });
  }

  function mobileIntent(){
    const s=state();if(!s)return;
    let bar=q('.rc5-mobile-action');
    if(!bar){bar=document.createElement('div');bar.className='rc5-mobile-action';document.body.appendChild(bar);}
    const current=q('.view:not(.hidden)')?.id;
    if(current==='projects'){bar.innerHTML='';return;}
    bar.innerHTML=`<span><small>Next</small><strong>${esc(s.next.label)}</strong></span><button data-rc5-mobile="${s.next.view}">Continue</button>`;
    q('[data-rc5-mobile]',bar)?.addEventListener('click',e=>jump(e.currentTarget.dataset.rc5Mobile));
  }

  function markBuild(){
    document.documentElement.dataset.coursebuildBuild='rc5-experience-debt';
    const tag=q('.topbar .tag');if(tag){tag.textContent='RC5 · Design completeness';tag.removeAttribute('aria-hidden');}
  }

  function render(){
    markBuild();homeExperience();addTrustBar();progressiveBlueprint();clarifyAI();mobileIntent();
  }

  let timer;
  function schedule(delay=40){clearTimeout(timer);timer=setTimeout(render,delay);}
  window.addEventListener('load',()=>schedule(220));
  document.addEventListener('click',e=>{if(e.target.closest('.steps button,[data-rc3-open],[data-rc3-continue],[data-rc3-check],#projectSwitcher'))schedule(90);});
  document.addEventListener('change',e=>{if(e.target.matches('input,textarea,select'))schedule(130);});
})();
