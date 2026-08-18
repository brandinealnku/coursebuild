/* CourseBuild v0.5 · master-to-version delta workflow */
(function(){
  const VERSION_MODES=[
    {id:"online",name:"Online",mode:"Online",description:"Asynchronous-first delivery with explicit weekly navigation and online interaction guidance."},
    {id:"in-person",name:"In-Person",mode:"In-Person",description:"Classroom-first delivery with live activity and facilitation guidance."},
    {id:"accelerated",name:"Accelerated",mode:"Accelerated",description:"Compressed delivery that preserves outcomes while tightening pacing and learner guidance."}
  ];
  function ensureVersionState(){
    data.master ||= {revision:0,approvedAt:"",signature:""};
    const old=Array.isArray(data.versions)?data.versions:[];
    data.versions=VERSION_MODES.map(def=>{
      const prior=old.find(v=>v.id===def.id)||{};
      return {...def,baseRevision:Number(prior.baseRevision||0),syncStatus:prior.syncStatus||"Not generated",approvalStatus:prior.approvalStatus||"Draft",approvedAt:prior.approvedAt||"",generatedAt:prior.generatedAt||"",adaptationNotes:prior.adaptationNotes||defaultNotes(def.id),changes:Array.isArray(prior.changes)?prior.changes:[],snapshot:prior.snapshot||null};
    });
  }
  function defaultNotes(id){
    if(id==="online") return "Favor asynchronous clarity, weekly checklists, explicit discussion expectations, and accessible digital navigation. Preserve outcomes and assessment intent.";
    if(id==="in-person") return "Favor live activities, classroom discussion, facilitation cues, and clear between-class follow-up. Preserve outcomes and assessment intent.";
    return "Compress pacing without deleting learning outcomes or changing assessment purpose. Make workload and sequencing explicit.";
  }
  function masterSignature(){
    const payload={profile:data.profile,modules:(data.modules||[]).map(m=>({id:m.id,order:m.order,title:m.title,summary:m.summary})),items:(data.items||[]).map(i=>({id:i.id,moduleId:i.moduleId,type:i.type,title:i.title,purpose:i.purpose,points:Number(i.points||0)}))};
    let h=2166136261;const s=JSON.stringify(payload);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);
  }
  function markVersionsStale(){
    ensureVersionState();
    data.versions.forEach(v=>{if(v.baseRevision&&v.baseRevision<data.master.revision){v.syncStatus="Out of Sync";v.approvalStatus="Needs Review";v.approvedAt="";}});
  }
  const originalApproveArchitecture=window.approveArchitecture;
  window.approveArchitecture=function(){
    const before=data.architecture.status;
    originalApproveArchitecture();
    if(before!=="Approved"&&data.architecture.status==="Approved"){
      ensureVersionState();
      data.master.revision=Number(data.master.revision||0)+1;
      data.master.approvedAt=data.architecture.approvedAt||new Date().toISOString();
      data.master.signature=masterSignature();
      markVersionsStale();
      save();renderVersions();
    }
  };
  const originalInvalidateArchitecture=window.invalidateArchitecture;
  window.invalidateArchitecture=function(){
    originalInvalidateArchitecture();
    ensureVersionState();
    data.versions.forEach(v=>{if(v.baseRevision){v.syncStatus="Out of Sync";v.approvalStatus="Needs Review";v.approvedAt="";}});
    save();
  };
  function recommendedChanges(v){
    const changes=[];
    (data.modules||[]).forEach(m=>{
      if(v.id==="online") changes.push({kind:"Module",targetId:m.id,target:m.title,field:"delivery",from:"Master",to:"Online",reason:"Add asynchronous navigation, completion checklist, and digital participation guidance."});
      if(v.id==="in-person") changes.push({kind:"Module",targetId:m.id,target:m.title,field:"delivery",from:"Master",to:"In-Person",reason:"Add live activity/facilitation cues and between-class follow-up."});
      if(v.id==="accelerated") changes.push({kind:"Module",targetId:m.id,target:m.title,field:"pacing",from:"Standard",to:"Compressed",reason:"Condense sequencing while preserving outcomes and assessment intent."});
    });
    (data.items||[]).forEach(i=>{
      if(v.id==="online"&&i.type==="Discussion") changes.push({kind:i.type,targetId:i.id,target:i.title,field:"interaction",from:"Master prompt",to:"Asynchronous prompt",reason:"Clarify response windows, peer interaction, and netiquette."});
      if(v.id==="in-person"&&i.type==="Discussion") changes.push({kind:i.type,targetId:i.id,target:i.title,field:"interaction",from:"Master prompt",to:"Live discussion",reason:"Convert toward facilitated classroom interaction with a follow-up artifact when appropriate."});
      if(v.id==="accelerated"&&i.type==="Assignment") changes.push({kind:i.type,targetId:i.id,target:i.title,field:"pacing",from:"Standard window",to:"Compressed window",reason:"Make milestone timing explicit without changing purpose or points."});
    });
    return changes;
  }
  function cloneMasterSnapshot(v){
    return {baseRevision:data.master.revision,profile:clone(data.profile),modules:clone(data.modules||[]),items:clone(data.items||[]),mode:v.mode,adaptationNotes:v.adaptationNotes};
  }
  function generateVersion(id){
    ensureVersionState();
    if(data.architecture.status!=="Approved") return toast("Approve the master architecture before generating versions.");
    const v=data.versions.find(x=>x.id===id);if(!v)return;
    v.baseRevision=data.master.revision;
    v.snapshot=cloneMasterSnapshot(v);
    v.changes=recommendedChanges(v);
    v.generatedAt=new Date().toISOString();
    v.syncStatus="Current";
    v.approvalStatus="Needs Review";
    v.approvedAt="";
    save();renderVersions();toast(`${v.name} version plan generated.`);
  }
  function approveVersion(id){
    const v=data.versions.find(x=>x.id===id);if(!v)return;
    if(!v.snapshot||v.baseRevision!==data.master.revision||v.syncStatus==="Out of Sync") return toast("Regenerate this version from the current master first.");
    v.approvalStatus="Approved";v.approvedAt=new Date().toISOString();v.syncStatus="Current";save();renderVersions();toast(`${v.name} version approved.`);
  }
  function updateVersionNotes(id,value){
    const v=data.versions.find(x=>x.id===id);if(!v)return;v.adaptationNotes=value.trim();if(v.snapshot){v.approvalStatus="Needs Review";v.approvedAt="";}save();renderVersions();
  }
  function diffTable(v){
    if(!v.changes.length)return `<p class="muted-text">Generate the version plan to see proposed differences from Master.</p>`;
    return `<div class="version-diffs">${v.changes.map(c=>`<div class="version-diff"><div><b>${esc(c.kind)} · ${esc(c.target)}</b><small>${esc(c.reason)}</small></div><span>${esc(c.from)} → ${esc(c.to)}</span></div>`).join("")}</div>`;
  }
  window.renderVersions=function(){
    ensureVersionState();
    const masterStatus=data.architecture.status==="Approved"?`Master r${data.master.revision}`:"Master needs approval";
    $("#versions").innerHTML=`<div class="section-head"><div><p class="eyebrow">Delivery Versions</p><h2>One approved master. Intentional delivery differences.</h2><p>Versions store deltas from the master instead of becoming disconnected copies. When the master changes, affected versions are marked out of sync.</p></div>${badge(masterStatus)}</div>
    <article class="panel version-master"><div><h3>Master Course</h3><p>The approved architecture remains authoritative for outcomes, module intent, LMS objects, and assessment purpose.</p></div><dl><dt>Revision</dt><dd>${data.master.revision||0}</dd><dt>Architecture</dt><dd>${badge(data.architecture.status)}</dd><dt>Approved</dt><dd>${data.master.approvedAt?esc(new Date(data.master.approvedAt).toLocaleString()):"—"}</dd></dl></article>
    <div class="version-stack">${data.versions.map(v=>`<article class="panel version-card"><div class="section-head compact"><div><p class="eyebrow">${esc(v.mode)}</p><h3>${esc(v.name)}</h3><p>${esc(v.description)}</p></div><div class="version-statuses">${badge(v.syncStatus)}${badge(v.approvalStatus)}</div></div><div class="grid two"><label class="version-notes">Adaptation rules<textarea data-version-notes="${v.id}" rows="4">${esc(v.adaptationNotes)}</textarea></label><dl><dt>Based on</dt><dd>${v.baseRevision?`Master r${v.baseRevision}`:"Not generated"}</dd><dt>Generated</dt><dd>${v.generatedAt?esc(new Date(v.generatedAt).toLocaleString()):"—"}</dd><dt>Approved</dt><dd>${v.approvedAt?esc(new Date(v.approvedAt).toLocaleString()):"—"}</dd><dt>Differences</dt><dd>${v.changes.length}</dd></dl></div>${diffTable(v)}<div class="actions"><button data-generate-version="${v.id}" class="primary">${v.snapshot?"Regenerate from Master":"Generate from Master"}</button><button data-approve-version="${v.id}" ${!v.snapshot||v.syncStatus==="Out of Sync"?"disabled":""}>Approve version</button></div></article>`).join("")}</div>`;
    document.querySelectorAll("[data-generate-version]").forEach(b=>b.onclick=()=>generateVersion(b.dataset.generateVersion));
    document.querySelectorAll("[data-approve-version]").forEach(b=>b.onclick=()=>approveVersion(b.dataset.approveVersion));
    document.querySelectorAll("[data-version-notes]").forEach(e=>e.onchange=()=>updateVersionNotes(e.dataset.versionNotes,e.value));
  };
  const originalReadinessChecks=window.readinessChecks;
  if(originalReadinessChecks){window.readinessChecks=function(){const checks=originalReadinessChecks();ensureVersionState();checks.push({label:"Approved versions are based on current master",pass:data.versions.filter(v=>v.approvalStatus==="Approved").every(v=>v.baseRevision===data.master.revision&&v.syncStatus==="Current")});return checks;};}
  ensureVersionState();
  if(data.architecture.status==="Approved"&&!data.master.revision){data.master.revision=1;data.master.approvedAt=data.architecture.approvedAt||new Date().toISOString();data.master.signature=masterSignature();save();}
  renderVersions();
})();