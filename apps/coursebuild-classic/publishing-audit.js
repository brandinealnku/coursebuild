/* CourseBuild Publishing Audit — durable course-level trust evidence */
(function(){
  const now=()=>new Date().toISOString();
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function ensure(){data.auditLog=Array.isArray(data.auditLog)?data.auditLog:[];return data.auditLog;}
  function courseIdentity(){return {courseId:data?.profile?.id||'',courseCode:data?.profile?.code||'',courseTitle:data?.profile?.title||''};}
  function append(event){
    const log=ensure();
    const record={id:`audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,timestamp:now(),...courseIdentity(),...event};
    log.unshift(record);if(log.length>500)log.length=500;save();return record;
  }
  function snapshotItems(){return new Map((data?.items||[]).map(i=>[i.id,{publish:i.publish?{...i.publish}:null,title:i.title,type:i.type,coursebuildKey:i.coursebuildKey||''}]));}
  function changedPublishEvents(before){
    (data?.items||[]).forEach(item=>{
      const prev=before.get(item.id)?.publish?.state||'Not sent';
      const next=item.publish?.state||'Not sent';
      if(prev===next)return;
      append({category:'Canvas publishing',action:'publish_state_changed',result:next,itemId:item.id,itemType:item.type,itemTitle:item.title,coursebuildKey:item.coursebuildKey||'',canvasId:item.publish?.canvasId||'',canvasUrl:item.publish?.canvasUrl||'',verifiedAt:item.publish?.verifiedAt||'',detail:`${prev} → ${next}`,error:item.publish?.error||item.publish?.verificationError||''});
    });
  }
  function exportCsv(){
    const rows=ensure().slice().reverse();
    const fields=['timestamp','category','action','result','courseCode','courseTitle','itemType','itemTitle','coursebuildKey','canvasId','canvasUrl','verifiedAt','detail','error'];
    const csv=[fields.join(','),...rows.map(r=>fields.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${data?.profile?.code||'course'}-publishing-audit.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);
  }
  function statusTone(result){const s=String(result||'').toLowerCase();if(s.includes('verified')||s.includes('connected'))return'good';if(s.includes('failed')||s.includes('failure'))return'bad';if(s.includes('unverified')||s.includes('publishing')||s.includes('configured'))return'warn';return'neutral';}
  function renderPanel(){
    const host=document.querySelector('#build');if(!host)return;let panel=host.querySelector('#publishingAudit');if(panel)panel.remove();
    const log=ensure();
    panel=document.createElement('section');panel.id='publishingAudit';panel.className='panel publishing-audit';
    panel.innerHTML=`<header><div><p class="eyebrow">Trust evidence</p><h3>Publishing activity</h3><p>CourseBuild records meaningful Canvas connection and publishing state changes for this course. Verified means Canvas read-back matched the intended CourseBuild object.</p></div><button id="exportPublishingAudit" ${log.length?'':'disabled'}>Export CSV</button></header>${log.length?`<div class="publishing-audit-list">${log.slice(0,20).map(r=>`<article><span class="audit-dot ${statusTone(r.result)}" aria-hidden="true"></span><div><strong>${escHtml(r.itemTitle||r.category||'Course activity')}</strong><p>${escHtml(r.detail||r.action||'')}</p><small>${escHtml(new Date(r.timestamp).toLocaleString())}${r.canvasId?` · Canvas ID ${escHtml(r.canvasId)}`:''}${r.error?` · ${escHtml(r.error)}`:''}</small></div><span class="audit-result ${statusTone(r.result)}">${escHtml(r.result||'Recorded')}</span></article>`).join('')}</div>${log.length>20?`<p class="audit-note">Showing the 20 most recent of ${log.length} recorded events. Export the CSV for the full course audit.</p>`:''}`:`<div class="audit-empty"><strong>No publishing activity recorded yet.</strong><p>Canvas verification and publish-state changes will appear here automatically.</p></div>`}`;
    host.appendChild(panel);panel.querySelector('#exportPublishingAudit')?.addEventListener('click',exportCsv);
  }
  const oldRenderBuild=window.renderBuild;
  if(typeof oldRenderBuild==='function')window.renderBuild=function(){oldRenderBuild();renderPanel();};
  const oldSendApproved=window.sendApproved;
  if(typeof oldSendApproved==='function')window.sendApproved=async function(){
    const before=snapshotItems();
    append({category:'Canvas publishing',action:'publish_run_started',result:'Started',detail:`Publish run requested for ${(data?.items||[]).length} course items.`});
    try{return await oldSendApproved.apply(this,arguments);}finally{changedPublishEvents(before);append({category:'Canvas publishing',action:'publish_run_completed',result:'Completed',detail:'Publish run completed. Review individual item states for verified, unverified, or failed results.'});renderPanel();}
  };
  const oldVerifyCanvas=window.verifyCanvasConnection;
  if(typeof oldVerifyCanvas==='function')window.verifyCanvasConnection=async function(){
    const before=settings?.canvasVerification?.state||'Not configured';
    try{return await oldVerifyCanvas.apply(this,arguments);}finally{const v=settings?.canvasVerification||{};append({category:'Canvas connection',action:'canvas_verification',result:v.state||'Unknown',detail:`${before} → ${v.state||'Unknown'}${v.courseName?` · ${v.courseName}`:''}`,canvasId:v.courseId||'',canvasUrl:v.courseUrl||'',verifiedAt:v.verifiedAt||'',error:v.error||''});renderPanel();}
  };
  window.CourseBuildPublishingAudit={append,entries:()=>ensure().slice(),exportCsv,render:renderPanel};
  ensure();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!document.querySelector('#build.hidden'))renderPanel();});
})();
