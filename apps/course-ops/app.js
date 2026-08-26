/* Course Ops Canvas Inspector v0.1 — read-only. */
(function(){
  const API='/api/course-ops';
  const STORE='courseops.canvas.target.v1';
  const state={service:null,target:null,inspection:null,filters:{query:'',type:'',status:'',module:''}};
  const q=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});};
  const statusText=row=>row.published===true?'Published':row.published===false?'Unpublished':'—';
  const statusKey=row=>row.published===true?'published':row.published===false?'unpublished':'unknown';
  function saveTarget(){if(state.target)localStorage.setItem(STORE,JSON.stringify(state.target));}
  function loadTarget(){try{state.target=JSON.parse(localStorage.getItem(STORE)||'null');}catch{state.target=null;}if(state.target){q('#canvasBaseUrl').value=state.target.canvasBaseUrl||'';q('#canvasCourseId').value=state.target.canvasCourseId||'';}}
  async function request(action,payload={}){
    const response=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})});
    const body=await response.json().catch(()=>({ok:false,error:'Course Ops returned an unreadable response.'}));
    if(!response.ok||body.ok===false)throw new Error(body.error||`Course Ops request failed (${response.status}).`);
    return body.data;
  }
  async function loadService(){
    const badge=q('#serviceStatus');
    try{
      const response=await fetch(API,{headers:{accept:'application/json'}}),body=await response.json();
      if(!response.ok||body.ok===false)throw new Error(body.error||'Service unavailable');
      state.service=body.data;badge.textContent=body.data.canvasConfigured?'Canvas service ready':'Canvas credentials missing';badge.className=`status ${body.data.canvasConfigured?'good':'warn'}`;
      const host=(body.data.approvedCanvasHosts||[])[0];if(host&&!q('#canvasBaseUrl').value)q('#canvasBaseUrl').value=`https://${host}`;
    }catch(error){badge.textContent='Service unavailable';badge.className='status warn';setMessage(`Course Ops service could not be reached. ${error.message||''}`,'error');}
  }
  function setMessage(text,type=''){const el=q('#connectionMessage');el.textContent=text;el.className=`message ${type}`;}
  function setBusy(busy){const button=q('#inspectButton');button.disabled=busy;button.textContent=busy?'Inspecting Canvas…':'Verify & inspect course';q('#refreshButton').disabled=busy;}
  async function inspect(target,{refresh=false}={}){
    setBusy(true);setMessage(refresh?'Refreshing the verified Canvas course…':'Verifying Canvas and loading the course shell…');
    try{
      const verified=await request('verifyCourse',target);
      q('#connectionBadge').textContent='Connected & verified';q('#connectionBadge').className='badge good';
      state.target={canvasBaseUrl:target.canvasBaseUrl,canvasCourseId:String(target.canvasCourseId)};saveTarget();
      const inspection=await request('inspectCourse',state.target);state.inspection=inspection;renderInspection();
      setMessage(`Verified ${verified.courseName||'Canvas course'} and loaded a fresh read-only inventory.`,'success');
    }catch(error){
      q('#connectionBadge').textContent='Verification failed';q('#connectionBadge').className='badge warn';
      setMessage(`Course Ops could not verify and inspect this Canvas course. ${error.message||''}`,'error');
      if(!refresh){state.inspection=null;q('#inspector').classList.add('hidden');}
    }finally{setBusy(false);}
  }
  function unique(values){return [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
  function fillFilters(){
    const rows=state.inspection?.rows||[];
    const types=unique(rows.map(r=>r.type)),modules=unique(rows.flatMap(r=>r.moduleNames||[]));
    q('#typeFilter').innerHTML='<option value="">All types</option>'+types.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    q('#moduleFilter').innerHTML='<option value="">All modules</option>'+modules.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    q('#typeFilter').value=state.filters.type;q('#moduleFilter').value=state.filters.module;
  }
  function renderSummary(){
    const counts=state.inspection?.counts||{};const order=['Module','Page','Assignment','Discussion','Quiz','File','Announcement'];
    q('#summaryCards').innerHTML=order.map(type=>`<article><span>${esc(type)}${Number(counts[type]||0)===1?'':'s'}</span><strong>${Number(counts[type]||0)}</strong></article>`).join('');
  }
  function filteredRows(){
    const f=state.filters,qry=f.query.trim().toLowerCase();
    return (state.inspection?.rows||[]).filter(r=>{
      if(f.type&&r.type!==f.type)return false;if(f.status&&statusKey(r)!==f.status)return false;if(f.module&&!(r.moduleNames||[]).includes(f.module))return false;
      if(qry){const hay=[r.type,r.title,...(r.moduleNames||[])].join(' ').toLowerCase();if(!hay.includes(qry))return false;}
      return true;
    });
  }
  function renderTable(){
    const rows=filteredRows();q('#resultCount').textContent=`${rows.length} item${rows.length===1?'':'s'}`;
    q('#inventoryBody').innerHTML=rows.map(r=>`<tr><td><span class="type-pill">${esc(r.type)}</span></td><td><strong>${esc(r.title)}</strong><small>${r.updatedAt?`Updated ${esc(fmtDate(r.updatedAt))}`:''}</small></td><td>${(r.moduleNames||[]).length?(r.moduleNames||[]).map(m=>`<span class="module-chip">${esc(m)}</span>`).join(' '):'<span class="muted">—</span>'}</td><td><span class="state ${statusKey(r)}">${esc(statusText(r))}</span></td><td>${esc(fmtDate(r.dueAt))}</td><td>${r.points==null?'—':esc(r.points)}</td><td>${r.htmlUrl?`<a href="${esc(r.htmlUrl)}" target="_blank" rel="noopener">Open</a>`:'—'}</td></tr>`).join('');
    q('#emptyState').classList.toggle('hidden',rows.length!==0);
  }
  function renderInspection(){
    const info=state.inspection;if(!info)return;const course=info.course||{};
    q('#courseTitle').textContent=course.name||course.code||'Canvas course';q('#courseMeta').textContent=[course.code,`Course ID ${course.id}`,course.host].filter(Boolean).join(' · ');
    q('#freshness').textContent=`Fresh Canvas read · ${fmtDate(info.inspectedAt)}`;q('#openCanvas').href=course.url||'#';
    q('#inspector').classList.remove('hidden');renderSummary();fillFilters();renderTable();
  }
  function bind(){
    q('#courseForm').addEventListener('submit',event=>{event.preventDefault();inspect({canvasBaseUrl:q('#canvasBaseUrl').value.trim(),canvasCourseId:q('#canvasCourseId').value.trim()});});
    q('#refreshButton').addEventListener('click',()=>state.target&&inspect(state.target,{refresh:true}));
    q('#searchInput').addEventListener('input',e=>{state.filters.query=e.target.value;renderTable();});
    q('#typeFilter').addEventListener('change',e=>{state.filters.type=e.target.value;renderTable();});
    q('#statusFilter').addEventListener('change',e=>{state.filters.status=e.target.value;renderTable();});
    q('#moduleFilter').addEventListener('change',e=>{state.filters.module=e.target.value;renderTable();});
    q('#clearFilters').addEventListener('click',()=>{state.filters={query:'',type:'',status:'',module:''};q('#searchInput').value='';q('#typeFilter').value='';q('#statusFilter').value='';q('#moduleFilter').value='';renderTable();});
  }
  function init(){loadTarget();bind();loadService();}
  window.CourseOps={version:'canvas-inspector-1',capabilities:{canvasRead:true,canvasWrite:false,bulkEdit:false,verification:true},getState:()=>state};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
