/* CourseBuild 1.0 — administrative work orchestrator.
   Separates instructor judgment from deterministic course-production work.
   This layer audits current CourseBuild evidence; it does not claim unsupported automation. */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=v=>esc(v??'');
  const nonempty=v=>Array.isArray(v)?v.length>0:String(v??'').trim().length>0;
  const itemApproved=i=>i?.generation?.state==='Approved'||i?.status==='Approved';
  const publishVerified=i=>window.CourseBuildTrustModel?.publishVerified?.(i)===true;

  function audit(){
    const profile=data.profile||{},items=data.items||[],modules=data.modules||[],source=data.source?.courseModel||null;
    const readiness=window.CourseBuildReadiness?.evaluate?.()||null;
    const alignment=window.CourseBuildAlignment?.audit?.()||null;
    const health=window.CourseBuildCourseIntelligence?.analyze?.()||null;
    const decisions=[];
    const handled=[];
    const blockers=[];

    const add=(arr,id,title,detail,view,kind='review')=>arr.push({id,title,detail,view,kind});

    if(!nonempty(profile.outcomes)) add(decisions,'outcomes','Define course learning outcomes','CourseBuild cannot determine the intended learning outcomes from the current accepted course profile.','profile','instructional');
    if(data.architecture?.status!=='Approved'&&modules.length&&items.length) add(decisions,'blueprint-approval','Approve the course Blueprint','CourseBuild can propose and validate structure, but the instructor must approve the learning architecture before downstream generation or publishing.','plan','instructional');

    items.filter(i=>!String(i.purpose||'').trim()).slice(0,6).forEach(i=>add(decisions,`purpose:${i.id}`,`Define the purpose of “${i.title||'Untitled item'}”`,'Purpose is an instructional decision and is required before the Blueprint can be approved.','plan','instructional'));
    items.filter(i=>['Assignment','Quiz'].includes(i.type)&&Number(i.points||0)<=0).slice(0,6).forEach(i=>add(decisions,`points:${i.id}`,`Set points for “${i.title||'Untitled assessment'}”`,'CourseBuild can configure the LMS value once the instructor decides how this assessment should contribute to grading.','plan','instructional'));

    if(alignment?.outcomesWithoutEvidence?.length){
      alignment.outcomesWithoutEvidence.slice(0,5).forEach(o=>add(decisions,`alignment:${o.id||o.outcome||o.title}`,`Confirm assessment evidence for ${o.outcome||o.title||'a learning outcome'}`,'CourseBuild found no instructor-declared assessment evidence for this outcome.','alignment','instructional'));
    }

    if(source){
      if(source.modules?.length) add(handled,'source-modules',`${source.modules.length} module/week structures detected`,'CourseBuild extracted these structures from source material with provenance for review.','profile','administrative');
      if(source.assessments?.length) add(handled,'source-assessments',`${source.assessments.length} assessment references detected`,'Assessment references, explicit points, and dates found in the source are retained as evidence instead of requiring manual re-entry.','profile','administrative');
      if(source.resources?.length) add(handled,'source-resources',`${source.resources.length} resource links inventoried`,'CourseBuild collected explicit URLs from source material so they can be checked and reconciled later.','profile','administrative');
    }
    if(modules.length||items.length) add(handled,'blueprint-model',`${modules.length} modules and ${items.length} LMS items modeled`,'CourseBuild keeps the course structure in one Blueprint instead of requiring object-by-object LMS assembly.','plan','administrative');
    const reviewed=items.filter(itemApproved).length;
    if(reviewed) add(handled,'content-review',`${reviewed}/${items.length} course items reviewed`,'Reviewed content state is retained across the course-production workflow.','review','administrative');
    const verified=items.filter(publishVerified).length;
    if(verified) add(handled,'verified-publish',`${verified}/${items.length} LMS items read-back verified`,'Verified publishing is counted only after CourseBuild records read-back evidence from Canvas.','build','administrative');

    const failedChecks=readiness?.sections?.flatMap(s=>s.checks||[]).filter(c=>c.state==='Needs attention')||[];
    failedChecks.forEach(c=>add(blockers,`readiness:${c.label}`,c.label,c.detail,c.actionView||'build','quality'));
    const unchecked=readiness?.sections?.flatMap(s=>s.checks||[]).filter(c=>c.state==='Not checked')||[];
    unchecked.forEach(c=>add(blockers,`unchecked:${c.label}`,c.label,c.detail,c.actionView||'build','unverified'));

    const detectedFacts=(source?.modules?.length||0)+(source?.assessments?.length||0)+(source?.resources?.length||0);
    const trackedAdminActions=detectedFacts+modules.length+items.length+reviewed+verified;
    return {
      decisions:dedupe(decisions),
      handled:dedupe(handled),
      blockers:dedupe(blockers),
      metrics:{trackedAdminActions,detectedFacts,modeledObjects:modules.length+items.length,verifiedPublishes:verified},
      readiness,
      health
    };
  }

  function dedupe(list){const seen=new Set();return list.filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true;});}
  function go(view){if(view&&typeof showView==='function')showView(view);}
  function taskCard(t,label){return `<article class="cb-admin-task"><div><span class="cb-admin-task-type">${safe(label)}</span><h4>${safe(t.title)}</h4><p>${safe(t.detail)}</p></div>${t.view?`<button type="button" data-cb-admin-view="${safe(t.view)}">Review</button>`:''}</article>`;}

  function renderCommandCenter(){
    const host=q('#projects');if(!host)return;
    q('[data-cb-admin-command]',host)?.remove();
    const a=audit();
    const section=document.createElement('section');section.className='panel cb-admin-command';section.dataset.cbAdminCommand='true';
    section.innerHTML=`<div class="cb-admin-title-row"><div><p class="eyebrow">Instructor decision queue</p><h3>CourseBuild handles the production work. You keep the teaching decisions.</h3><p>Nothing here is counted as complete unless CourseBuild has evidence for it.</p></div><div class="cb-admin-metric"><strong>${a.decisions.length}</strong><span>decisions need you</span></div></div>
      <div class="cb-admin-summary-grid"><article><span>Administrative actions tracked</span><strong>${a.metrics.trackedAdminActions}</strong><small>Evidence-backed actions and extracted facts, not a time-savings estimate.</small></article><article><span>CourseBuild can already carry</span><strong>${a.handled.length}</strong><small>Current production workstreams with retained evidence.</small></article><article><span>Readiness attention</span><strong>${a.blockers.filter(x=>x.kind==='quality').length}</strong><small>Testable checks that currently need attention.</small></article><article><span>Still unverified</span><strong>${a.blockers.filter(x=>x.kind==='unverified').length}</strong><small>Unsupported checks remain explicitly unverified.</small></article></div>
      <div class="cb-admin-columns"><section><div class="cb-admin-column-head"><span>Needs instructor judgment</span><strong>${a.decisions.length}</strong></div>${a.decisions.length?a.decisions.slice(0,6).map(t=>taskCard(t,'Instructor decision')).join(''):'<div class="cb-admin-empty"><strong>No unresolved instructional decisions detected.</strong><p>Continue Course Readiness to check operational issues.</p></div>'}</section><section><div class="cb-admin-column-head"><span>CourseBuild is carrying</span><strong>${a.handled.length}</strong></div>${a.handled.length?a.handled.slice(0,6).map(t=>taskCard(t,'Administrative work')).join(''):'<div class="cb-admin-empty"><strong>No production work tracked yet.</strong><p>Add source material or create a Blueprint to begin.</p></div>'}</section></div>`;
    const anchor=q('.cb-command-kpis',host)||host.firstChild;anchor?.insertAdjacentElement('afterend',section);
    qa('[data-cb-admin-view]',section).forEach(b=>b.onclick=()=>go(b.dataset.cbAdminView));
  }

  function renderPreflight(){
    const host=q('#build');if(!host)return;
    q('[data-cb-admin-preflight]',host)?.remove();
    const a=audit();
    const quality=a.blockers.filter(x=>x.kind==='quality'),unverified=a.blockers.filter(x=>x.kind==='unverified');
    const section=document.createElement('section');section.className='panel cb-admin-preflight';section.dataset.cbAdminPreflight='true';
    section.innerHTML=`<div class="cb-admin-title-row"><div><p class="eyebrow">Course preflight</p><h3>${quality.length?`${quality.length} testable issue${quality.length===1?'':'s'} still need attention`:'No current testable readiness blockers'}</h3><p>${unverified.length?`${unverified.length} additional check${unverified.length===1?' is':'s are'} not yet supported and remain unverified.`:'All currently represented readiness dimensions are testable.'}</p></div><div class="cb-admin-metric"><strong>${a.readiness?.score??0}%</strong><span>evidence-backed</span></div></div>
      ${a.decisions.length?`<div class="cb-admin-callout"><strong>${a.decisions.length} instructional decision${a.decisions.length===1?'':'s'} remain.</strong><p>CourseBuild will not silently make these decisions for the instructor.</p></div>`:''}
      <div class="cb-admin-preflight-list">${quality.slice(0,8).map(t=>taskCard(t,'Needs attention')).join('')}${unverified.slice(0,5).map(t=>taskCard(t,'Not checked')).join('')}</div>`;
    host.append(section);qa('[data-cb-admin-view]',section).forEach(b=>b.onclick=()=>go(b.dataset.cbAdminView));
  }

  function install(){
    const projectBase=window.CourseBuildProjects?.render;
    if(typeof projectBase==='function')window.CourseBuildProjects.render=function(){projectBase();renderCommandCenter();};
    const buildBase=window.renderBuild;
    if(typeof buildBase==='function')window.renderBuild=function(){buildBase();setTimeout(renderPreflight,0);};
    document.querySelector('.steps button[data-view="projects"]')?.addEventListener('click',()=>setTimeout(renderCommandCenter,0));
    document.querySelector('.steps button[data-view="build"]')?.addEventListener('click',()=>setTimeout(renderPreflight,0));
    window.CourseBuildAdministrativeOrchestrator={audit,renderCommandCenter,renderPreflight};
    setTimeout(()=>{renderCommandCenter();if(!q('#build')?.classList.contains('hidden'))renderPreflight();},120);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
