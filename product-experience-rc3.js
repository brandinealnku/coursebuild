/* CourseBuild Product Experience RC3 — product consolidation layer */
(function(){
  const q=s=>document.querySelector(s);
  const safe=v=>esc(v??"");
  const pct=(n,d)=>d?Math.round((n/d)*100):0;
  const profileFields=()=>[
    ['Course basics', ['code','title','institution','credits','defaultDeliveryMode']],
    ['Learners', ['audience']],
    ['Learning design', ['description','outcomes']],
    ['Course requirements', ['policies']]
  ];
  function hasValue(key){const v=data.profile?.[key];return Array.isArray(v)?v.length>0:String(v??'').trim().length>0;}
  function setupProgress(){const keys=profileFields().flatMap(x=>x[1]);const done=keys.filter(hasValue).length;return {done,total:keys.length,percent:pct(done,keys.length)};}
  function approvedItems(){return (data.items||[]).filter(i=>i.status==='Approved').length;}
  function readiness(){
    const setup=setupProgress();
    const checks=[
      {label:'Course information complete',ok:setup.percent===100,detail:`${setup.done} of ${setup.total} setup areas complete`,view:'profile'},
      {label:'Course blueprint approved',ok:data.architecture?.status==='Approved',detail:`${data.modules?.length||0} modules · ${data.items?.length||0} course items`,view:'plan'},
      {label:'Generated content reviewed',ok:(data.items?.length||0)>0&&approvedItems()===(data.items?.length||0),detail:`${approvedItems()} of ${data.items?.length||0} approved`,view:'review'},
      {label:'Canvas connection configured',ok:Boolean(settings?.canvasCourseId&&settings?.canvasBaseUrl&&settings?.appsScriptUrl),detail:settings?.canvasCourseId?'Connection details present':'Connection required',view:'settings'}
    ];
    return {checks,passed:checks.filter(x=>x.ok).length,percent:pct(checks.filter(x=>x.ok).length,checks.length)};
  }
  function statusPill(label,tone='neutral'){return `<span class="rc3-status ${tone}">${safe(label)}</span>`;}
  function jump(view){document.querySelector(`.steps button[data-view="${view}"]`)?.click();}

  function renderDashboard(){
    const host=q('#projects');if(!host||!window.CourseBuildProjects)return;
    const list=CourseBuildProjects.list(); const current=CourseBuildProjects.currentId();
    const cards=list.map(meta=>{
      let env=null;try{env=JSON.parse(localStorage.getItem(`coursebuild.project.v1.${meta.id}`)||'null');}catch(e){}
      const state=env?.courseState||{}; const p=state.profile||{}; const items=state.items||[];
      const setupKeys=['code','title','institution','credits','defaultDeliveryMode','audience','description','outcomes','policies'];
      const filled=setupKeys.filter(k=>Array.isArray(p[k])?p[k].length:String(p[k]??'').trim()).length;
      const blueprint=state.architecture?.status==='Approved'; const reviewed=items.length?items.filter(i=>i.status==='Approved').length:0;
      const score=Math.round(((filled/setupKeys.length)*35)+(blueprint?30:0)+(items.length?(reviewed/items.length)*35:0));
      const next=!blueprint?'Continue setup':reviewed<items.length?'Review content':'Check Canvas readiness';
      return `<article class="rc3-course-card ${meta.id===current?'active':''}"><div class="rc3-course-card-main"><div class="rc3-course-title"><span>${safe(meta.courseCode||'Course')}</span><h3>${safe(meta.courseTitle||meta.name||'Untitled course')}</h3></div><strong class="rc3-score">${score}%</strong></div><div class="rc3-progress"><i style="width:${score}%"></i></div><div class="rc3-course-meta"><span>${blueprint?'Blueprint approved':'Blueprint not approved'}</span><span>${reviewed}/${items.length} content items reviewed</span></div><div class="rc3-course-actions"><button data-rc3-open="${safe(meta.id)}" ${meta.id===current?'disabled':''}>${meta.id===current?'Current course':'Open'}</button>${meta.id===current?`<button class="primary" data-rc3-continue="1">${safe(next)} →</button>`:''}</div></article>`;
    }).join('');
    host.innerHTML=`<div class="section-head rc3-head"><div><p class="eyebrow">Workspace</p><h2>My courses</h2><p>Pick up where you left off or start a new course. Status is based on actual course progress—not a generic project state.</p></div><button class="primary" id="rc3NewCourse">+ New course</button></div><div class="rc3-course-grid">${cards}</div>`;
    q('#rc3NewCourse')?.addEventListener('click',()=>q('#newProjectQuick')?.click());
    host.querySelectorAll('[data-rc3-open]').forEach(b=>b.onclick=()=>{const sel=q('#projectSwitcher');if(sel){sel.value=b.dataset.rc3Open;sel.dispatchEvent(new Event('change'));}});
    host.querySelector('[data-rc3-continue]')?.addEventListener('click',()=>{const r=readiness();const target=!data.architecture||data.architecture.status!=='Approved'?'plan':approvedItems()<(data.items?.length||0)?'review':'build';jump(target);});
  }

  function renderSetup(){
    const host=q('#profile');if(!host)return; const pr=setupProgress();
    const section=(title,body,done)=>`<section class="rc3-setup-section"><header><div><span>${done?'Complete':'Needs attention'}</span><h3>${title}</h3></div>${statusPill(done?'Complete':'Incomplete',done?'good':'neutral')}</header>${body}</section>`;
    const basicsDone=['code','title','institution','credits','defaultDeliveryMode'].every(hasValue);
    const learnerDone=hasValue('audience');const designDone=['description','outcomes'].every(hasValue);const reqDone=hasValue('policies');
    host.innerHTML=`<div class="section-head rc3-head"><div><p class="eyebrow">Course setup</p><h2>${safe(data.profile.code||'New course')} ${data.profile.title?`· ${safe(data.profile.title)}`:''}</h2><p>Give CourseBuild the instructional context it needs. Your work saves locally as you move through the course.</p></div><div class="rc3-completion"><strong>${pr.percent}%</strong><span>setup complete</span></div></div><div class="rc3-progress large"><i style="width:${pr.percent}%"></i></div><form id="rc3ProfileForm" class="rc3-setup-form">${section('Course basics',`<div class="grid two"><label>Course code<input name="code" value="${safe(data.profile.code||'')}"></label><label>Course title<input name="title" value="${safe(data.profile.title||'')}"></label><label>Institution<input name="institution" value="${safe(data.profile.institution||'')}"></label><label>Credits<input name="credits" value="${safe(data.profile.credits||'')}"></label><label>Delivery mode<select name="defaultDeliveryMode"><option>In-Person</option><option>Online</option><option>Hybrid</option><option>Flexible</option></select></label></div>`,basicsDone)}${section('Learners',`<label>Who is this course for?<input name="audience" value="${safe(data.profile.audience||'')}" placeholder="e.g., first-year undergraduate students"></label>`,learnerDone)}${section('Learning design',`<label>Course description<textarea name="description" rows="4">${safe(data.profile.description||'')}</textarea></label><label>Learning outcomes<textarea name="outcomes" rows="6" placeholder="One outcome per line">${safe((data.profile.outcomes||[]).join('\n'))}</textarea></label>`,designDone)}${section('Course requirements',`<label>Course rules & preferences<textarea name="policies" rows="5" placeholder="Accessibility expectations, grading rules, AI-use guidance, tone, required teaching approaches…">${safe((data.profile.policies||[]).join('\n'))}</textarea></label>`,reqDone)}<div class="rc3-form-footer"><span id="rc3SaveState">Saved locally</span><button class="primary">Save & continue to blueprint →</button></div></form>`;
    const form=q('#rc3ProfileForm'),select=form?.querySelector('select[name="defaultDeliveryMode"]');if(select)select.value=data.profile.defaultDeliveryMode||'In-Person';
    form?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(form);data.profile={...data.profile,...Object.fromEntries(f.entries()),outcomes:String(f.get('outcomes')||'').split(/\n+/).map(x=>x.trim()).filter(Boolean),policies:String(f.get('policies')||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)};invalidateArchitecture();save();renderSetup();jump('plan');});
  }

  function renderBlueprint(){
    const host=q('#plan');if(!host)return; const a=data.architecture?.status||'Draft';
    const selected=data.items.find(i=>i.id===selectedItemId)||data.items[0]||null;if(selected)selectedItemId=selected.id;
    const moduleRows=(data.modules||[]).map((m,mi)=>`<section class="rc3-module"><header><span class="rc3-module-index">${String(mi+1).padStart(2,'0')}</span><div><input data-rc3-module-title="${safe(m.id)}" value="${safe(m.title)}"><small>${data.items.filter(i=>i.moduleId===m.id).length} course items</small></div><button class="rc3-icon" data-rc3-module-more="${safe(m.id)}" aria-label="Module actions">•••</button></header><div class="rc3-items">${data.items.filter(i=>i.moduleId===m.id).map(i=>`<button class="rc3-item ${i.id===selectedItemId?'selected':''}" data-rc3-item="${safe(i.id)}"><span>${safe(i.type)}</span><strong>${safe(i.title||'Untitled item')}</strong><em>${safe(i.status||'Planned')}</em></button>`).join('')||'<p class="rc3-empty">No course items yet.</p>'}</div><button class="rc3-add-item" data-rc3-add-item="${safe(m.id)}">+ Add course item</button></section>`).join('');
    const inspector=selected?`<aside class="rc3-inspector"><div class="rc3-inspector-head"><div><span>${safe(selected.type)}</span><h3>Edit course item</h3></div>${statusPill(selected.status||'Planned')}</div><label>Title<input id="rc3ItemTitle" value="${safe(selected.title||'')}"></label><label>Purpose<textarea id="rc3ItemPurpose" rows="5">${safe(selected.purpose||'')}</textarea></label><div class="grid two"><label>Type<select id="rc3ItemType"><option>Page</option><option>Assignment</option><option>Discussion</option></select></label><label>Points<input id="rc3ItemPoints" type="number" min="0" value="${Number(selected.points||0)}"></label></div><div class="rc3-inspector-meta"><span>CourseBuild key</span><code>${safe(selected.coursebuildKey||'assigned on save')}</code></div><div class="rc3-inspector-actions"><button id="rc3DeleteItem" class="danger-text">Delete item</button><button id="rc3DoneItem" class="primary">Done</button></div></aside>`:`<aside class="rc3-inspector empty"><h3>Select a course item</h3><p>Choose an item in the course map to edit its purpose, type, points, and title.</p></aside>`;
    host.innerHTML=`<div class="section-head rc3-head"><div><p class="eyebrow">Course blueprint</p><h2>Shape the course before content is generated.</h2><p>CourseBuild proposes the structure. You decide what belongs, what changes, and when the blueprint is ready.</p></div>${statusPill(a,a==='Approved'?'good':'neutral')}</div><div class="rc3-blueprint-top"><section class="rc3-source"><h3>Source material</h3><textarea id="sourceText" rows="5" placeholder="Paste your syllabus or course plan…">${safe(data.source?.text||'')}</textarea><div class="actions"><input id="sourceFile" type="file" accept=".txt,.md,.csv,.html,.htm,application/pdf" hidden><button id="rc3Upload">Upload file</button><button id="saveSource">Save source</button><button id="architectBtn" class="primary">Generate blueprint</button></div><p>${data.source?.fileName?`Using ${safe(data.source.fileName)}`:data.source?.digest?'Source analyzed':data.source?.text?'Source ready':'Add source material to begin.'}</p></section><section class="rc3-blueprint-summary"><div><span>Modules</span><strong>${data.modules.length}</strong></div><div><span>Course items</span><strong>${data.items.length}</strong></div><div><span>Status</span><strong>${safe(a)}</strong></div><div class="actions"><button id="addModule">+ Add module</button><button id="approveArchitecture" class="primary" ${!data.modules.length||!data.items.length?'disabled':''}>Approve blueprint</button></div></section></div><div class="rc3-blueprint-workspace"><div class="rc3-course-map">${moduleRows||'<div class="rc3-empty-state"><h3>No blueprint yet</h3><p>Add source material and generate a blueprint, or add your first module manually.</p><button id="rc3EmptyAdd" class="primary">+ Add first module</button></div>'}</div>${inspector}</div>`;
    q('#rc3Upload')?.addEventListener('click',()=>q('#sourceFile')?.click()); q('#sourceFile')?.addEventListener('change',e=>handleFile(e.target.files?.[0]));
    q('#saveSource')?.addEventListener('click',()=>{data.source={...data.source,text:q('#sourceText').value.trim(),importedAt:new Date().toISOString(),importMode:'paste'};invalidateArchitecture();save();renderBlueprint();});
    q('#architectBtn')?.addEventListener('click',generateArchitecture);q('#addModule')?.addEventListener('click',addModule);q('#rc3EmptyAdd')?.addEventListener('click',addModule);q('#approveArchitecture')?.addEventListener('click',approveArchitecture);
    host.querySelectorAll('[data-rc3-item]').forEach(b=>b.onclick=()=>{selectedItemId=b.dataset.rc3Item;renderBlueprint();});
    host.querySelectorAll('[data-rc3-add-item]').forEach(b=>b.onclick=()=>addItem(b.dataset.rc3AddItem));
    host.querySelectorAll('[data-rc3-module-title]').forEach(e=>e.onchange=()=>patchModule(e.dataset.rc3ModuleTitle,{title:e.value.trim()}));
    host.querySelectorAll('[data-rc3-module-more]').forEach(b=>b.onclick=()=>{const id=b.dataset.rc3ModuleMore;const idx=data.modules.findIndex(m=>m.id===id);const choice=prompt('Module action: type UP, DOWN, or DELETE','');if(!choice)return;const c=choice.trim().toUpperCase();if(c==='UP')moveModule(id,'up');else if(c==='DOWN')moveModule(id,'down');else if(c==='DELETE')safeDeleteModule(id);});
    if(selected){const type=q('#rc3ItemType');if(type)type.value=selected.type;q('#rc3ItemTitle').onchange=e=>patchItem(selected.id,{title:e.target.value.trim()});q('#rc3ItemPurpose').onchange=e=>patchItem(selected.id,{purpose:e.target.value.trim()});q('#rc3ItemType').onchange=e=>patchItem(selected.id,{type:e.target.value});q('#rc3ItemPoints').onchange=e=>patchItem(selected.id,{points:Number(e.target.value||0)});q('#rc3DeleteItem').onclick=()=>safeDeleteItem(selected.id);q('#rc3DoneItem').onclick=()=>renderBlueprint();}
  }

  function undoBar(message,undo){let bar=q('#rc3Undo');if(bar)bar.remove();bar=document.createElement('div');bar.id='rc3Undo';bar.className='rc3-undo';bar.innerHTML=`<span>${safe(message)}</span><button>Undo</button>`;document.body.appendChild(bar);const t=setTimeout(()=>bar.remove(),7000);bar.querySelector('button').onclick=()=>{clearTimeout(t);undo();bar.remove();};}
  function safeDeleteItem(id){const snapshot=clone(data);const item=data.items.find(i=>i.id===id);data.items=data.items.filter(i=>i.id!==id);selectedItemId=data.items[0]?.id||null;invalidateArchitecture();save();renderBlueprint();undoBar(`Deleted “${item?.title||'course item'}”`,()=>{data=clone(snapshot);save();renderAll();showView('plan');});}
  function safeDeleteModule(id){const m=data.modules.find(x=>x.id===id);const count=data.items.filter(i=>i.moduleId===id).length;if(!confirm(`Delete “${m?.title||'this module'}” and ${count} course item${count===1?'':'s'}?`))return;const snapshot=clone(data);data.modules=data.modules.filter(x=>x.id!==id);data.items=data.items.filter(i=>i.moduleId!==id);data.modules.forEach((x,i)=>x.order=i+1);invalidateArchitecture();save();renderBlueprint();undoBar(`Deleted “${m?.title||'module'}”`,()=>{data=clone(snapshot);save();renderAll();showView('plan');});}

  function renderReadiness(){
    const host=q('#build');if(!host)return; const old=window.__rc3OriginalRenderBuild;if(old){old();}
    const existing=[...host.childNodes]; const r=readiness(); const remaining=r.checks.filter(x=>!x.ok);
    host.innerHTML='';const shell=document.createElement('div');shell.innerHTML=`<div class="section-head rc3-head"><div><p class="eyebrow">Canvas readiness</p><h2>${r.passed===r.checks.length?'Ready for Canvas':'Prepare your course for Canvas.'}</h2><p>CourseBuild checks the instructional decisions that matter before anything is published.</p></div><div class="rc3-completion"><strong>${r.percent}%</strong><span>ready</span></div></div><div class="rc3-readiness"><section class="rc3-readiness-list">${r.checks.map(c=>`<button data-rc3-check="${c.view}" class="${c.ok?'done':''}"><i>${c.ok?'✓':'!'}</i><span><strong>${safe(c.label)}</strong><small>${safe(c.detail)}</small></span><em>${c.ok?'Complete':'Review'}</em></button>`).join('')}</section><aside class="rc3-publish-summary"><span>Canvas publish</span><h3>${remaining.length?`${remaining.length} step${remaining.length===1?'':'s'} remaining`:'Course checks complete'}</h3><p>${remaining.length?'Resolve the remaining checks before publishing. Your existing Canvas content is not silently deleted.':'Preview exactly what CourseBuild will create before you publish.'}</p></aside></div><details class="rc3-advanced-build"><summary>Preview & publish controls</summary><div class="rc3-legacy-host"></div></details>`;host.append(...shell.childNodes);const legacy=host.querySelector('.rc3-legacy-host');existing.forEach(n=>legacy?.appendChild(n));host.querySelectorAll('[data-rc3-check]').forEach(b=>b.onclick=()=>jump(b.dataset.rc3Check));
  }

  function cleanChrome(){const tag=q('.topbar .tag');if(tag)tag.textContent='';const label=q('#projectChrome label');if(label&&label.firstChild)label.firstChild.nodeValue='Course';const add=q('#newProjectQuick');if(add)add.textContent='+ New course';}

  function install(){
    window.__rc3OriginalRenderBuild=window.renderBuild;
    window.renderProfile=renderSetup; window.renderPlan=renderBlueprint; window.renderBuild=renderReadiness;
    if(window.CourseBuildProjects)CourseBuildProjects.render=renderDashboard;
    document.querySelectorAll('.steps button[data-view]').forEach(b=>{const map={projects:'My courses',profile:'Course setup',plan:'Blueprint',review:'Content review',build:'Canvas readiness',versions:'Adapt',settings:'Settings'};if(map[b.dataset.view])b.textContent=map[b.dataset.view];if(['telemetry','pilot','cohort'].includes(b.dataset.view))b.hidden=true;});
    cleanChrome();renderAll();renderDashboard();showView('projects');
  }
  window.addEventListener('load',()=>setTimeout(install,0));
})();
