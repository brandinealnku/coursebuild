/* CourseBuild Learning Alignment — explicit instructor-declared outcome and assessment mapping */
(function(){
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assessedTypes=new Set(['Assignment','Quiz','Discussion']);
  function ensureState(){
    data.alignment ||= {outcomes:[],standards:[]};
    const profileOutcomes=Array.isArray(data.profile?.outcomes)?data.profile.outcomes:[];
    const prior=Array.isArray(data.alignment.outcomes)?data.alignment.outcomes:[];
    data.alignment.outcomes=profileOutcomes.map((text,i)=>({id:prior[i]?.id||`outcome-${i+1}`,text:String(text||'').trim()}));
    (data.items||[]).forEach(item=>{
      item.alignmentOutcomeIds=Array.isArray(item.alignmentOutcomeIds)?item.alignmentOutcomeIds.filter(Boolean):[];
      item.evidenceRole=item.evidenceRole|| (assessedTypes.has(item.type)?'Assessment evidence':'Learning support');
    });
  }
  function isAssessment(item){return assessedTypes.has(item.type)||item.evidenceRole==='Assessment evidence';}
  function audit(){
    ensureState();
    const outcomes=data.alignment.outcomes.filter(o=>o.text);
    const items=data.items||[];
    const assessments=items.filter(isAssessment);
    const coverage=outcomes.map(o=>{
      const mapped=items.filter(i=>i.alignmentOutcomeIds.includes(o.id));
      const evidence=assessments.filter(i=>i.alignmentOutcomeIds.includes(o.id));
      return {...o,mapped,evidence,hasLearning:mapped.length>0,hasEvidence:evidence.length>0};
    });
    const unmappedItems=items.filter(i=>!i.alignmentOutcomeIds.length);
    const outcomesWithoutEvidence=coverage.filter(o=>!o.hasEvidence);
    const mappedAssessments=assessments.filter(i=>i.alignmentOutcomeIds.length);
    const score=outcomes.length?Math.round((coverage.filter(o=>o.hasEvidence).length/outcomes.length)*100):0;
    return {outcomes,items,assessments,coverage,unmappedItems,outcomesWithoutEvidence,mappedAssessments,score};
  }
  function toggle(itemId,outcomeId,checked){
    const item=(data.items||[]).find(i=>i.id===itemId);if(!item)return;ensureState();
    const set=new Set(item.alignmentOutcomeIds);checked?set.add(outcomeId):set.delete(outcomeId);item.alignmentOutcomeIds=[...set];save();render();
  }
  function setEvidenceRole(itemId,value){const item=(data.items||[]).find(i=>i.id===itemId);if(!item)return;item.evidenceRole=value;save();render();}
  function exportMatrix(){
    const a=audit();
    const rows=[['Course item','Type','Evidence role',...a.outcomes.map(o=>o.text)]];
    a.items.forEach(i=>rows.push([i.title||'',i.type||'',i.evidenceRole||'',...a.outcomes.map(o=>i.alignmentOutcomeIds.includes(o.id)?'Mapped':'')]));
    const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),aEl=document.createElement('a');aEl.href=url;aEl.download=`${data.profile?.code||'course'}-learning-alignment.csv`;document.body.appendChild(aEl);aEl.click();setTimeout(()=>{URL.revokeObjectURL(url);aEl.remove();},0);
  }
  function render(){
    ensureState();const host=document.querySelector('#alignment');if(!host)return;const a=audit();
    const state=a.outcomes.length?(a.score===100?'good':a.score>=50?'warn':'bad'):'warn';
    host.innerHTML=`<div class="section-head"><div><p class="eyebrow">Learning intelligence</p><h2>Outcome & assessment alignment</h2><p>Map course activities and assessments to the learning outcomes they are intended to support. CourseBuild reports declared coverage; it does not claim instructional quality has been externally validated.</p></div><div class="la-score ${state}"><strong>${a.score}%</strong><span>outcomes with assessment evidence</span></div></div>
    <section class="la-summary"><article><span>Learning outcomes</span><strong>${a.outcomes.length}</strong></article><article><span>Assessment items</span><strong>${a.assessments.length}</strong></article><article><span>Outcomes with evidence</span><strong>${a.coverage.filter(x=>x.hasEvidence).length}</strong></article><article><span>Unmapped items</span><strong>${a.unmappedItems.length}</strong></article></section>
    <section class="panel la-coverage"><header><div><p class="eyebrow">Coverage</p><h3>Outcome evidence</h3></div><button id="laExport" ${a.outcomes.length?'':'disabled'}>Export alignment matrix</button></header>${a.outcomes.length?`<div class="la-outcomes">${a.coverage.map((o,idx)=>`<article><div class="la-outcome-num">${idx+1}</div><div><strong>${escHtml(o.text)}</strong><p>${o.mapped.length} mapped course item${o.mapped.length===1?'':'s'} · ${o.evidence.length} assessment evidence item${o.evidence.length===1?'':'s'}</p></div><span class="la-state ${o.hasEvidence?'good':o.hasLearning?'warn':'bad'}">${o.hasEvidence?'Evidence mapped':o.hasLearning?'Learning only':'Not covered'}</span></article>`).join('')}</div>`:`<div class="la-empty"><strong>Add learning outcomes in Course setup first.</strong><p>Alignment becomes available after at least one course learning outcome is defined.</p></div>`}</section>
    <section class="panel la-matrix"><header><div><p class="eyebrow">Instructor mapping</p><h3>Course items → outcomes</h3><p>Explicit mappings are instructor-controlled. CourseBuild does not infer alignment and present it as fact.</p></div></header>${a.items.length&&a.outcomes.length?`<div class="la-items">${a.items.map(item=>`<article class="la-item"><div class="la-item-head"><div><span class="la-type">${escHtml(item.type||'Item')}</span><strong>${escHtml(item.title||'Untitled item')}</strong></div><label>Role<select data-la-role="${escHtml(item.id)}"><option ${item.evidenceRole==='Learning support'?'selected':''}>Learning support</option><option ${item.evidenceRole==='Assessment evidence'?'selected':''}>Assessment evidence</option></select></label></div><div class="la-checks">${a.outcomes.map((o,idx)=>`<label><input type="checkbox" data-la-item="${escHtml(item.id)}" data-la-outcome="${escHtml(o.id)}" ${item.alignmentOutcomeIds.includes(o.id)?'checked':''}><span><b>Outcome ${idx+1}</b>${escHtml(o.text)}</span></label>`).join('')}</div></article>`).join('')}</div>`:`<div class="la-empty"><strong>${!a.outcomes.length?'Learning outcomes are required.':'Add course items in the Blueprint first.'}</strong><p>Once both outcomes and course items exist, you can build an explicit alignment matrix here.</p></div>`}</section>
    <section class="panel la-trust"><p class="eyebrow">Trust boundary</p><h3>Declared alignment, not accreditation theater.</h3><p>This view reports the mappings recorded by the instructor. A mapped outcome means the instructor has designated that relationship; it does not mean CourseBuild has independently validated rigor, accreditation compliance, or student mastery.</p></section>`;
    document.querySelectorAll('[data-la-item]').forEach(el=>el.onchange=()=>toggle(el.dataset.laItem,el.dataset.laOutcome,el.checked));
    document.querySelectorAll('[data-la-role]').forEach(el=>el.onchange=()=>setEvidenceRole(el.dataset.laRole,el.value));
    document.querySelector('#laExport')?.addEventListener('click',exportMatrix);
  }
  function wire(){
    document.querySelector('.steps button[data-view="alignment"]')?.addEventListener('click',()=>setTimeout(render,0));
    window.CourseBuildAlignment={audit,render,exportMatrix,ensureState};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
