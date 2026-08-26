/* CourseBuild v0.11 · instructor-controlled reconciliation resolution */
(function(){
  const oldRenderVersions=window.renderVersions;
  function state(v){
    v.materialization ||= {targetCanvasCourseId:"",preview:null,lastRun:null};
    v.materialization.resolution ||= {decisions:{},preview:null,lastRepair:null,history:[]};
    return v.materialization;
  }
  function issueKey(type,x,index){return [type,x.marker||x.masterItemId||x.title||x.expectedModule||x||index].join(":").replace(/[^A-Za-z0-9_.:-]/g,"_");}
  function issuesFrom(r){
    if(!r)return[];const out=[];
    (r.missing||[]).forEach((x,i)=>out.push({key:issueKey("missing",x,i),type:"missing",label:`Missing · ${x.type} · ${x.title}`,repairable:true}));
    (r.duplicates||[]).forEach((x,i)=>out.push({key:issueKey("duplicate",x,i),type:"duplicate",label:`Duplicate (${x.count}) · ${x.type} · ${x.title}`,repairable:false,manualReason:"Duplicate cleanup requires choosing which Canvas object to keep; CourseBuild will not auto-delete content."}));
    (r.misplaced||[]).forEach((x,i)=>out.push({key:issueKey("misplaced",x,i),type:"misplaced",label:`Wrong module · ${x.type} · ${x.title} → ${x.expectedModule}`,repairable:true}));
    (r.unexpectedPublished||[]).forEach((x,i)=>out.push({key:issueKey("published",x,i),type:"unexpectedPublished",label:`Unexpectedly published · ${x.type} · ${x.title}`,repairable:true}));
    (r.missingModules||[]).forEach((x,i)=>out.push({key:issueKey("missingModule",x,i),type:"missingModule",label:`Missing module · ${x}`,repairable:true}));
    (r.unexpectedCourseBuildItems||[]).forEach((x,i)=>out.push({key:issueKey("unexpected",x,i),type:"unexpectedCourseBuildItem",label:`Unexpected CourseBuild item · ${x.type} · ${x.title}`,repairable:false,manualReason:"Removing an unexpected CourseBuild-owned object is destructive; CourseBuild requires manual cleanup in this pilot."}));
    return out;
  }
  function decision(s,key){return s.resolution.decisions[key]||{choice:"",note:"",decidedAt:""};}
  function effectiveStatus(issue,d){if(d.choice==="Accept")return"Accepted exception";if(d.choice==="Ignore")return"Deferred";if(d.choice==="Repair")return issue.repairable?"Repair queued":"Manual repair required";return"Unresolved";}
  function controls(v){
    const s=state(v),r=s.reconciliation;if(!r||r.readyForInstructorReview)return"";
    const issues=issuesFrom(r);const unresolved=issues.filter(i=>!decision(s,i.key).choice||decision(s,i.key).choice==="Ignore").length;
    const accepted=issues.filter(i=>decision(s,i.key).choice==="Accept").length;
    const queued=issues.filter(i=>decision(s,i.key).choice==="Repair").length;
    const repairableQueued=issues.filter(i=>decision(s,i.key).choice==="Repair"&&i.repairable).length;
    const manualQueued=issues.filter(i=>decision(s,i.key).choice==="Repair"&&!i.repairable).length;
    return `<div class="resolution-workflow"><div class="section-head compact"><div><p class="eyebrow">Resolution</p><h4>Decide what happens to each discrepancy</h4><p>Repair proposes a safe correction where CourseBuild can do so non-destructively. Accept records an intentional exception. Ignore defers the issue and keeps the shell unresolved.</p></div>${badge(`${unresolved} unresolved`)}</div>
      <div class="resolution-list">${issues.map(i=>{const d=decision(s,i.key);return `<div class="resolution-row"><div><b>${esc(i.label)}</b><small>${esc(i.manualReason||"CourseBuild can repair this by safely re-materializing the approved version and then verifying again.")}</small></div><div class="resolution-choice"><select data-resolution-choice="${esc(v.id)}" data-issue-key="${esc(i.key)}"><option value="">Choose…</option><option ${d.choice==="Repair"?"selected":""}>Repair</option><option ${d.choice==="Accept"?"selected":""}>Accept</option><option ${d.choice==="Ignore"?"selected":""}>Ignore</option></select>${badge(effectiveStatus(i,d))}</div></div>`}).join("")}</div>
      <div class="cards mini-cards"><article class="card"><span>Repair queued</span><strong>${queued}</strong></article><article class="card"><span>Accepted</span><strong>${accepted}</strong></article><article class="card"><span>Deferred / unresolved</span><strong>${unresolved}</strong></article></div>
      <div class="actions"><button data-preview-repairs="${v.id}" ${!repairableQueued?"disabled":""}>Preview approved repairs</button><button data-run-repairs="${v.id}" class="primary" ${!s.resolution.preview||manualQueued?"disabled":""}>Execute repairs + verify</button></div>
      ${s.resolution.preview?`<div class="dry-run"><b>Repair preview</b><span>${s.resolution.preview.repairableCount} safe repair${s.resolution.preview.repairableCount===1?"":"s"} will re-materialize the approved version into the existing target shell using stable CourseBuild keys.</span><small>${s.resolution.preview.manualCount?`${s.resolution.preview.manualCount} destructive/manual issue${s.resolution.preview.manualCount===1?"":"s"} must be resolved or accepted before automated repair can run.`:"No destructive cleanup is included."}</small></div>`:""}
      ${s.resolution.lastRepair?`<div class="materialization-result"><b>Last repair cycle</b><span>${s.resolution.lastRepair.created} created · ${s.resolution.lastRepair.updated} updated · ${s.resolution.lastRepair.remainingIssues} raw issue${s.resolution.lastRepair.remainingIssues===1?"":"s"} after verification</span><small>${esc(new Date(s.resolution.lastRepair.completedAt).toLocaleString())}</small></div>`:""}</div>`;
  }
  window.renderVersions=function(){
    oldRenderVersions();
    (data.versions||[]).forEach(v=>{const card=document.querySelector(`[data-generate-version="${v.id}"]`)?.closest(".version-card");if(card)card.insertAdjacentHTML("beforeend",controls(v));});
    document.querySelectorAll("[data-resolution-choice]").forEach(e=>e.onchange=()=>setChoice(e.dataset.resolutionChoice,e.dataset.issueKey,e.value));
    document.querySelectorAll("[data-preview-repairs]").forEach(b=>b.onclick=()=>previewRepairs(b.dataset.previewRepairs));
    document.querySelectorAll("[data-run-repairs]").forEach(b=>b.onclick=()=>runRepairs(b.dataset.runRepairs));
  };
  function setChoice(versionId,key,choice){const v=data.versions.find(x=>x.id===versionId);if(!v)return;const s=state(v);s.resolution.decisions[key]={choice,note:"",decidedAt:new Date().toISOString()};s.resolution.preview=null;s.resolution.history.push({at:new Date().toISOString(),issueKey:key,choice});save();window.CourseBuildTelemetry?.event?.("reconciliation_decision",{versionId,issueKey:key,choice});renderVersions();}
  function previewRepairs(id){const v=data.versions.find(x=>x.id===id);if(!v)return;const s=state(v),issues=issuesFrom(s.reconciliation);const queued=issues.filter(i=>decision(s,i.key).choice==="Repair");s.resolution.preview={createdAt:new Date().toISOString(),repairableCount:queued.filter(i=>i.repairable).length,manualCount:queued.filter(i=>!i.repairable).length,issueKeys:queued.map(i=>i.key)};save();window.CourseBuildTelemetry?.event?.("reconciliation_repair_preview",{versionId:id,repairableCount:s.resolution.preview.repairableCount,manualCount:s.resolution.preview.manualCount});renderVersions();toast("Repair preview ready. No Canvas objects changed.");}
  async function runRepairs(id){
    const v=data.versions.find(x=>x.id===id);if(!v)return;const s=state(v);if(!s.resolution.preview)return toast("Preview repairs first.");
    const current=issuesFrom(s.reconciliation);const manual=current.filter(i=>decision(s,i.key).choice==="Repair"&&!i.repairable);if(manual.length)return toast("Resolve destructive/manual repair choices before automated repair.");
    try{
      const out=await api("materializeVersion",{version:v,masterRevision:data.master.revision,targetCanvasCourseId:s.targetCanvasCourseId});
      const verify=await api("reconcileVersionBuild",{version:v,masterRevision:data.master.revision,targetCanvasCourseId:s.targetCanvasCourseId});
      s.reconciliation={...verify,verifiedAt:new Date().toISOString()};
      s.resolution.lastRepair={created:out.created||0,updated:out.updated||0,remainingIssues:verify.issueCount||0,completedAt:new Date().toISOString()};s.resolution.preview=null;
      const still=new Set(issuesFrom(s.reconciliation).map(i=>i.key));Object.keys(s.resolution.decisions).forEach(k=>{if(!still.has(k)&&s.resolution.decisions[k].choice==="Repair")s.resolution.decisions[k]={...s.resolution.decisions[k],choice:"Repaired",resolvedAt:new Date().toISOString()};});
      save();window.CourseBuildTelemetry?.event?.("reconciliation_repair_executed",{versionId:id,created:out.created||0,updated:out.updated||0,remainingIssues:verify.issueCount||0,readyForInstructorReview:verify.readyForInstructorReview});renderVersions();
      toast(verify.readyForInstructorReview?`${v.name} repaired and verified.`:`Repair cycle complete; ${verify.issueCount} raw issue${verify.issueCount===1?"":"s"} remain.`);
    }catch(e){window.CourseBuildTelemetry?.event?.("failure",{stage:"reconciliation_repair",versionId:id,message:e.message});toast(e.message);}
  }
  window.CourseBuildResolution={issuesFrom};
  renderVersions();
})();
