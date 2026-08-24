/* CourseBuild 1.0 canonical Course Readiness model. Unsupported checks remain Not checked. */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const safe=v=>esc(v??'');
  const M=()=>window.CourseBuildTrustModel;
  const result=(label,state,detail,actionView='')=>({label,state,detail,actionView});
  const pass=(l,d,v='')=>result(l,'Pass',d,v),warn=(l,d,v='')=>result(l,'Needs attention',d,v),unchecked=(l,d)=>result(l,'Not checked',d,'');

  function evaluate(){
    const profile=data.profile||{},items=data.items||[],modules=data.modules||[];
    const structure=[];
    structure.push(profile.title&&profile.description?pass('Course identity','Title and description are present.','profile'):warn('Course identity','Add a course title and description.','profile'));
    structure.push((profile.outcomes||[]).length?pass('Learning outcomes',`${profile.outcomes.length} outcome${profile.outcomes.length===1?'':'s'} recorded.`,'profile'):warn('Learning outcomes','No course learning outcomes are recorded.','profile'));
    structure.push((data.source?.text||data.source?.digest)?pass('Source grounding','CourseBuild retained source material for this course.','plan'):warn('Source grounding','Add syllabus or course source material.','plan'));
    structure.push(modules.length&&items.length?pass('Blueprint structure',`${modules.length} modules · ${items.length} course items.`,'plan'):warn('Blueprint structure','A course Blueprint has not been assembled.','plan'));
    structure.push(data.architecture?.status==='Approved'?pass('Blueprint approval','Instructor approval is recorded.','plan'):warn('Blueprint approval','Blueprint is still draft and requires instructor approval.','plan'));
    structure.push(items.length&&items.every(i=>modules.some(m=>m.id===i.moduleId)&&String(i.title||'').trim()&&String(i.purpose||'').trim())?pass('Item completeness','Every item has a module, title, and purpose.','plan'):warn('Item completeness','One or more items are missing a module, title, or purpose.','plan'));

    const graded=items.filter(i=>['Assignment','Quiz'].includes(i.type));
    const assessment=[];
    assessment.push(graded.length?pass('Assessment inventory',`${graded.length} graded assignment/quiz item${graded.length===1?'':'s'} represented.`,'plan'):unchecked('Assessment inventory','No graded assignments or quizzes are represented yet.'));
    if(graded.length)assessment.push(graded.every(i=>Number(i.points||0)>0)?pass('Assessment points','All represented assignments/quizzes have point values.','plan'):warn('Assessment points','One or more assignments/quizzes have no positive point value.','plan'));
    assessment.push(unchecked('Rubric coverage','Rubrics are not yet represented as first-class CourseBuild objects.'));

    const alignment=[];
    const audit=window.CourseBuildAlignment?.audit?.();
    if(!audit||!audit.outcomes?.length)alignment.push(warn('Outcome alignment','Learning outcomes must be defined before evidence coverage can be evaluated.','alignment'));
    else alignment.push(audit.score===100?pass('Outcome assessment evidence','Every recorded outcome has instructor-declared assessment evidence.','alignment'):warn('Outcome assessment evidence',`${audit.outcomesWithoutEvidence?.length||0} outcome${(audit.outcomesWithoutEvidence?.length||0)===1?'':'s'} lack assessment evidence.`,'alignment'));

    const resources=[];
    const health=window.CourseBuildCourseIntelligence?.analyze?.();
    if(health)resources.push((health.blockers||[]).length?warn('Course integrity',`${health.blockers.length} structural blocker${health.blockers.length===1?'':'s'} detected.','health'):pass('Course integrity','No current structural blockers detected by local preflight.','health'));
    else resources.push(unchecked('Course integrity','Course Health analysis is not available.'));
    resources.push(unchecked('Live link validation','CourseBuild has not yet performed network validation of external resources.'));
    resources.push(unchecked('Accessibility QA','Accessibility checks are not yet implemented as an evidence-backed readiness dimension.'));

    const canvas=[];
    const v=M()?.normalizedCanvasVerification?.(settings)||settings.canvasVerification||{state:'Not configured'};
    canvas.push(v.state==='Connected and verified'?pass('Canvas destination',`Verified: ${v.courseName||v.courseId}.`,'settings'):warn('Canvas destination',v.state==='Connection failed'?'Canvas connection verification failed.':'Canvas destination has not been verified.','settings'));
    const overview=data.canvasOverview;
    canvas.push(overview?.updatedAt?pass('Canvas inventory',`Live Canvas inventory last read ${new Date(overview.updatedAt).toLocaleString()}.`,'projects'):unchecked('Canvas inventory','No successful live Canvas inventory read is recorded.'));
    const published=items.filter(i=>M()?.publishVerified?.(i)).length;
    canvas.push(items.length&&published===items.length?pass('Publishing verification',`${published}/${items.length} items are read-back verified in Canvas.`,'build'):warn('Publishing verification',`${published}/${items.length} course items are read-back verified in Canvas.`,'build'));

    const schedule=[unchecked('Schedule validation','Course dates and semester scheduling are not yet modeled deeply enough for verification.')];
    const sections=[{id:'structure',label:'Structure',checks:structure},{id:'assessment',label:'Assessment',checks:assessment},{id:'alignment',label:'Learning alignment',checks:alignment},{id:'resources',label:'Resources & quality',checks:resources},{id:'schedule',label:'Schedule',checks:schedule},{id:'canvas',label:'LMS & publishing',checks:canvas}];
    const scored=sections.flatMap(s=>s.checks).filter(c=>c.state!=='Not checked');const passed=scored.filter(c=>c.state==='Pass').length;const score=scored.length?Math.round(passed/scored.length*100):0;
    return{score,passed,total:scored.length,notChecked:sections.flatMap(s=>s.checks).filter(c=>c.state==='Not checked').length,sections};
  }

  function render(){
    const host=q('#build');if(!host)return;const existing=q('[data-course-readiness]',host);if(existing)existing.remove();const r=evaluate();
    const box=document.createElement('section');box.className='panel';box.dataset.courseReadiness='true';
    box.innerHTML=`<div class="section-head"><div><p class="eyebrow">Course readiness</p><h2>${r.score}% evidence-backed readiness</h2><p>${r.passed}/${r.total} currently testable checks pass. ${r.notChecked} check${r.notChecked===1?' is':'s are'} explicitly marked Not checked rather than treated as passing.</p></div></div>${r.sections.map(s=>`<section><h3>${safe(s.label)}</h3><div class="checklist">${s.checks.map(c=>`<div><strong>${c.state==='Pass'?'✓':c.state==='Needs attention'?'!':'—'} ${safe(c.label)}</strong><span class="badge ${c.state==='Pass'?'good':c.state==='Needs attention'?'warn':'muted'}">${safe(c.state)}</span><p>${safe(c.detail)}</p>${c.actionView?`<button type="button" data-readiness-view="${safe(c.actionView)}">Review</button>`:''}</div>`).join('')}</div></section>`).join('')}<p class="hint"><strong>Readiness is evidence, not AI confidence.</strong> Unsupported checks remain Not checked until CourseBuild can actually evaluate them.</p>`;
    host.prepend(box);q('[data-course-readiness]',host)?.querySelectorAll('[data-readiness-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.readinessView)));
  }
  function install(){
    const base=window.renderBuild;if(typeof base==='function')window.renderBuild=function(){base();render();};
    window.CourseBuildReadiness={evaluate,render};
    document.querySelector('.steps button[data-view="build"]')?.addEventListener('click',()=>setTimeout(render,0));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
