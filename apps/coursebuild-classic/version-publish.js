/* CourseBuild v0.7 · approved delivery-version Canvas materialization */
(function(){
  const oldRenderVersions=window.renderVersions;
  function publishState(v){
    v.materialization ||= {targetCanvasCourseId:"",preview:null,lastRun:null};
    return v.materialization;
  }
  function publishControls(v){
    const s=publishState(v);
    const ready=v.approvalStatus==="Approved"&&v.syncStatus==="Current"&&v.baseRevision===data.master.revision;
    const p=s.preview;
    return `<div class="version-publish"><div class="section-head compact"><div><p class="eyebrow">Canvas shell</p><h4>Materialize approved ${esc(v.name)} version</h4><p>Dry-run first. CourseBuild will never write this delivery version into the Master Canvas course.</p></div>${badge(ready?"Version ready":"Approval required")}</div><label>Target Canvas Course ID<input data-version-target="${v.id}" value="${esc(s.targetCanvasCourseId||"")}" placeholder="Target shell course ID"></label><div class="actions"><button data-preview-version-build="${v.id}" ${!ready?"disabled":""}>Dry-run preview</button><button data-materialize-version="${v.id}" class="primary" ${!ready||!p?"disabled":""}>Build / update target shell</button></div>${p?`<div class="dry-run"><b>Dry run · ${esc(p.targetCourseName||"Canvas course")}</b><span>${p.modules} modules · ${p.eligibleItems} eligible items · ${p.skippedItems} skipped · ${p.changes} approved delivery differences</span><small>No Canvas objects were changed by this preview.</small></div>`:""}${s.lastRun?`<div class="materialization-result"><b>Last materialization</b><span>${s.lastRun.created} created · ${s.lastRun.updated} updated · Master r${s.lastRun.masterRevision}</span><small>${esc(new Date(s.lastRun.completedAt).toLocaleString())}</small></div>`:""}</div>`;
  }
  window.renderVersions=function(){
    oldRenderVersions();
    (data.versions||[]).forEach(v=>{
      const card=document.querySelector(`[data-generate-version="${v.id}"]`)?.closest(".version-card");
      if(card)card.insertAdjacentHTML("beforeend",publishControls(v));
    });
    document.querySelectorAll("[data-version-target]").forEach(e=>e.onchange=()=>{const v=data.versions.find(x=>x.id===e.dataset.versionTarget);if(!v)return;const s=publishState(v);s.targetCanvasCourseId=e.value.trim();s.preview=null;save();renderVersions();});
    document.querySelectorAll("[data-preview-version-build]").forEach(b=>b.onclick=()=>previewVersionBuild(b.dataset.previewVersionBuild));
    document.querySelectorAll("[data-materialize-version]").forEach(b=>b.onclick=()=>materializeVersion(b.dataset.materializeVersion));
  };
  async function previewVersionBuild(id){
    const v=data.versions.find(x=>x.id===id);if(!v)return;
    const s=publishState(v);if(!s.targetCanvasCourseId)return toast("Enter the target Canvas Course ID first.");
    try{
      const out=await api("previewVersionBuild",{version:v,masterRevision:data.master.revision,targetCanvasCourseId:s.targetCanvasCourseId});
      s.preview=out;save();renderVersions();
      window.CourseBuildTelemetry?.event?.("version_build_preview",{versionId:id,targetCanvasCourseId:s.targetCanvasCourseId,eligibleItems:out.eligibleItems,modules:out.modules});
      toast(`Dry run ready for ${out.targetCourseName}.`);
    }catch(e){window.CourseBuildTelemetry?.event?.("failure",{stage:"version_build_preview",message:e.message});toast(e.message);}
  }
  async function materializeVersion(id){
    const v=data.versions.find(x=>x.id===id);if(!v)return;const s=publishState(v);
    if(!s.preview)return toast("Run the dry-run preview first.");
    if(String(s.targetCanvasCourseId)===String(settings.canvasCourseId||""))return toast("Choose a target Canvas shell different from the Master course.");
    try{
      const out=await api("materializeVersion",{version:v,masterRevision:data.master.revision,targetCanvasCourseId:s.targetCanvasCourseId});
      s.lastRun={...out,completedAt:new Date().toISOString()};s.preview=null;save();renderVersions();
      window.CourseBuildTelemetry?.event?.("version_materialized",{versionId:id,targetCanvasCourseId:s.targetCanvasCourseId,created:out.created,updated:out.updated,itemCount:(out.results||[]).length});
      toast(`${v.name} shell complete: ${out.created} created, ${out.updated} updated.`);
    }catch(e){window.CourseBuildTelemetry?.event?.("failure",{stage:"version_materialization",versionId:id,message:e.message});toast(e.message);}
  }
  renderVersions();
})();
