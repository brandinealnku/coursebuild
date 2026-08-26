/* CourseBuild v0.8 · read-only target-shell reconciliation */
(function(){
  const oldRenderVersions=window.renderVersions;
  function state(v){
    v.materialization ||= {targetCanvasCourseId:"",preview:null,lastRun:null};
    v.materialization.reconciliation ||= null;
    return v.materialization;
  }
  function issueBadge(report){
    if(!report)return badge("Not verified");
    return badge(report.readyForInstructorReview?"Ready for review":`${report.issueCount} issue${report.issueCount===1?"":"s"}`);
  }
  function reportHtml(r){
    if(!r)return `<p class="muted-text">Run verification after materializing this version to compare the expected CourseBuild plan with the actual target Canvas shell.</p>`;
    const issues=[];
    (r.missing||[]).forEach(x=>issues.push(`Missing · ${x.type} · ${x.title}`));
    (r.duplicates||[]).forEach(x=>issues.push(`Duplicate (${x.count}) · ${x.type} · ${x.title}`));
    (r.misplaced||[]).forEach(x=>issues.push(`Wrong module · ${x.type} · ${x.title}`));
    (r.unexpectedPublished||[]).forEach(x=>issues.push(`Unexpectedly published · ${x.type} · ${x.title}`));
    (r.missingModules||[]).forEach(x=>issues.push(`Missing module · ${x}`));
    (r.unexpectedCourseBuildItems||[]).forEach(x=>issues.push(`Unexpected CourseBuild item · ${x.type} · ${x.title}`));
    return `<div class="reconcile-report"><div class="cards mini-cards"><article class="card"><span>Expected</span><strong>${r.expectedItems}</strong></article><article class="card"><span>Matched</span><strong>${r.matchedItems}</strong></article><article class="card"><span>Issues</span><strong>${r.issueCount}</strong></article></div><div class="check-list"><div class="check-row"><span class="check-icon">${r.readyForInstructorReview?"✓":"!"}</span><span>${r.readyForInstructorReview?"Target shell matches the approved CourseBuild plan and remains unpublished.":"Target shell needs attention before instructor review."}</span>${issueBadge(r)}</div>${issues.map(x=>`<div class="check-row"><span class="check-icon">!</span><span>${esc(x)}</span>${badge("Needs attention")}</div>`).join("")||`<div class="check-row"><span class="check-icon">✓</span><span>No missing, duplicate, misplaced, unexpectedly published, or unexpected CourseBuild items detected.</span>${badge("Pass")}</div>`}</div><p class="hint">Verified ${esc(new Date(r.verifiedAt).toLocaleString())} · ${esc(r.targetCourseName||"Canvas course")} · Master r${r.masterRevision}${r.scanLimitWarning?" · "+esc(r.scanLimitWarning):""}</p></div>`;
  }
  window.renderVersions=function(){
    oldRenderVersions();
    (data.versions||[]).forEach(v=>{
      const card=document.querySelector(`[data-generate-version="${v.id}"]`)?.closest(".version-card");
      if(!card)return;
      const s=state(v);const ready=v.approvalStatus==="Approved"&&v.syncStatus==="Current"&&v.baseRevision===data.master.revision&&s.targetCanvasCourseId;
      card.insertAdjacentHTML("beforeend",`<div class="version-reconcile"><div class="section-head compact"><div><p class="eyebrow">Post-build verification</p><h4>Reconcile target Canvas shell</h4><p>Read-only verification compares the approved version with what actually exists in Canvas. CourseBuild will not repair discrepancies automatically.</p></div>${issueBadge(s.reconciliation)}</div><div class="actions"><button data-reconcile-version="${v.id}" ${!ready?"disabled":""}>Verify target shell</button></div>${reportHtml(s.reconciliation)}</div>`);
    });
    document.querySelectorAll("[data-reconcile-version]").forEach(b=>b.onclick=()=>reconcileVersion(b.dataset.reconcileVersion));
  };
  async function reconcileVersion(id){
    const v=data.versions.find(x=>x.id===id);if(!v)return;const s=state(v);
    if(!s.targetCanvasCourseId)return toast("Enter the target Canvas Course ID first.");
    try{
      const out=await api("reconcileVersionBuild",{version:v,masterRevision:data.master.revision,targetCanvasCourseId:s.targetCanvasCourseId});
      s.reconciliation={...out,verifiedAt:new Date().toISOString()};save();renderVersions();
      window.CourseBuildTelemetry?.event?.("version_reconciled",{versionId:id,targetCanvasCourseId:s.targetCanvasCourseId,readyForInstructorReview:out.readyForInstructorReview,issueCount:out.issueCount,missing:(out.missing||[]).length,duplicates:(out.duplicates||[]).length,misplaced:(out.misplaced||[]).length,unexpectedPublished:(out.unexpectedPublished||[]).length});
      toast(out.readyForInstructorReview?`${v.name} shell verified and ready for instructor review.`:`${v.name} shell verification found ${out.issueCount} issue${out.issueCount===1?"":"s"}.`);
    }catch(e){window.CourseBuildTelemetry?.event?.("failure",{stage:"version_reconciliation",versionId:id,message:e.message});toast(e.message);}
  }
  renderVersions();
})();
