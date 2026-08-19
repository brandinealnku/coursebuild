/* CourseBuild Course Intelligence — deterministic local preflight, no optimistic external verification */
(function(){
  const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getText=()=>{
    const chunks=[data?.source?.text||'',data?.profile?.description||'',...(data?.profile?.policies||[])];
    (data?.items||[]).forEach(i=>chunks.push(i.title||'',i.purpose||'',i.content||'',i.body||'',i.instructions||''));
    return chunks.join('\n');
  };
  const urls=()=>{
    const matches=getText().match(/https?:\/\/[^\s<>"')\]]+/gi)||[];
    return [...new Set(matches.map(u=>u.replace(/[.,;:!?]+$/,'')))];
  };
  const resources=()=>urls().map(url=>{try{const u=new URL(url);return {url,domain:u.hostname.replace(/^www\./,''),protocol:u.protocol};}catch(e){return null;}}).filter(Boolean);
  const duplicateTitles=()=>{
    const seen=new Map(),dupes=[];
    (data?.items||[]).forEach(i=>{const k=String(i.title||'').trim().toLowerCase();if(!k)return;if(seen.has(k))dupes.push(i.title);else seen.set(k,i.id);});
    return [...new Set(dupes)];
  };
  const pointIssues=()=> (data?.items||[]).filter(i=>['Assignment','Quiz'].includes(i.type)&&(!Number.isFinite(Number(i.points))||Number(i.points)<=0));
  const unreviewed=()=> (data?.items||[]).filter(i=>i.status!=='Approved');
  const orphaned=()=>{const ids=new Set((data?.modules||[]).map(m=>m.id));return (data?.items||[]).filter(i=>!ids.has(i.moduleId));};
  const untitled=()=> (data?.items||[]).filter(i=>!String(i.title||'').trim());
  function audit(){
    const r=resources(),domains=[...new Set(r.map(x=>x.domain))].sort();
    const issues=[];
    if(!(data?.modules||[]).length)issues.push({level:'blocker',label:'No course modules',action:'Build or add a Blueprint before publishing.'});
    if(untitled().length)issues.push({level:'blocker',label:`${untitled().length} untitled course item${untitled().length===1?'':'s'}`,action:'Name every course item before publishing.'});
    if(orphaned().length)issues.push({level:'blocker',label:`${orphaned().length} item${orphaned().length===1?' is':'s are'} outside the module structure`,action:'Assign each item to a valid module.'});
    if(duplicateTitles().length)issues.push({level:'attention',label:`${duplicateTitles().length} duplicate title${duplicateTitles().length===1?'':'s'}`,action:'Confirm duplicates are intentional.'});
    if(pointIssues().length)issues.push({level:'attention',label:`${pointIssues().length} graded item${pointIssues().length===1?'':'s'} with missing/zero points`,action:'Confirm point values before Canvas publishing.'});
    if(unreviewed().length)issues.push({level:'attention',label:`${unreviewed().length} item${unreviewed().length===1?'':'s'} still need instructor approval`,action:'Review AI-assisted content before publishing.'});
    const blocker=issues.filter(x=>x.level==='blocker').length,attention=issues.filter(x=>x.level==='attention').length;
    const score=Math.max(0,100-(blocker*25)-(attention*8));
    return {score,issues,resources:r,domains,blocker,attention};
  }
  function download(name,text,type='text/plain'){
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);
  }
  function exportWhitelist(){
    const a=audit(),p=data?.profile||{};
    const text=[`CourseBuild Resource / Allowlist Report`,`Course: ${p.code||''} ${p.title||''}`.trim(),`Generated: ${new Date().toLocaleString()}`,'','External domains',...a.domains.map(d=>`- ${d}`),'','Detected URLs',...a.resources.map(r=>`- ${r.url}`),'','Note: This inventory is generated from URLs currently detectable in CourseBuild course data. Review before distributing as an institutional allowlist.'].join('\n');
    download(`${p.code||'course'}-resource-allowlist.txt`,text);
  }
  function render(){
    const host=document.querySelector('#health');if(!host)return;const a=audit();
    const tone=a.blocker?'bad':a.attention?'warn':'good';
    host.innerHTML=`<div class="section-head"><div><p class="eyebrow">Course intelligence</p><h2>Course health</h2><p>Automated preflight for the administrative details that are easy to miss while building and maintaining a course.</p></div><div class="ci-score ${tone}"><strong>${a.score}%</strong><span>health score</span></div></div><section class="ci-summary"><article><span>Modules</span><strong>${data?.modules?.length||0}</strong></article><article><span>Course items</span><strong>${data?.items?.length||0}</strong></article><article><span>External domains</span><strong>${a.domains.length}</strong></article><article><span>Needs attention</span><strong>${a.issues.length}</strong></article></section><div class="ci-grid"><section class="panel ci-panel"><header><div><p class="eyebrow">Preflight</p><h3>Automated checks</h3></div><span class="ci-state ${tone}">${a.blocker?'Resolve blockers':a.attention?'Review':'Ready'}</span></header>${a.issues.length?`<div class="ci-issues">${a.issues.map(i=>`<article class="${i.level}"><span aria-hidden="true">${i.level==='blocker'?'!':'•'}</span><div><strong>${escHtml(i.label)}</strong><p>${escHtml(i.action)}</p></div></article>`).join('')}</div>`:`<div class="ci-empty"><strong>No local preflight issues found.</strong><p>CourseBuild found no structural, review, duplicate-title, or point-value issues in the current course data.</p></div>`}<p class="ci-caveat">Course health is a local preflight. It does not claim that external links, accessibility, or Canvas publishing have been verified.</p></section><section class="panel ci-panel"><header><div><p class="eyebrow">Resources</p><h3>External resource inventory</h3></div><button id="ciExport" ${a.domains.length?'':'disabled'}>Export allowlist</button></header>${a.domains.length?`<div class="ci-domains">${a.domains.map(d=>`<div><span>${escHtml(d)}</span><small>${a.resources.filter(r=>r.domain===d).length} detected URL${a.resources.filter(r=>r.domain===d).length===1?'':'s'}</small></div>`).join('')}</div>`:`<div class="ci-empty"><strong>No external domains detected.</strong><p>URLs in source material and course content will appear here automatically.</p></div>`}<p class="ci-caveat">Designed for course support, technology review, and district allowlist preparation.</p></section></div><section class="panel ci-next"><p class="eyebrow">Operations roadmap</p><h3>From build to maintain.</h3><p>This foundation is designed to grow into semester rollover, due-date shifting, broken-link verification, accessibility preflight, syllabus-to-Canvas reconciliation, and change reporting without weakening CourseBuild's instructor-approval model.</p></section>`;
    document.querySelector('#ciExport')?.addEventListener('click',exportWhitelist);
  }
  function wire(){
    document.querySelector('.steps button[data-view="health"]')?.addEventListener('click',()=>setTimeout(render,0));
    window.CourseBuildIntelligence={audit,render,exportWhitelist};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
