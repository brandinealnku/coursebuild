/* CourseBuild pilot readiness — document intelligence + command center */
(function(){
  const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=v=>esc(v??'');
  const now=()=>new Date().toISOString();
  const canvasState=()=>window.CourseBuildTrustModel?.normalizedCanvasVerification?.(settings)||settings.canvasVerification||{state:'Not configured'};
  const isVerified=()=>canvasState().state==='Connected and verified';

  function sectionText(text,labels){
    const lines=String(text||'').split(/\r?\n/), lower=labels.map(x=>x.toLowerCase());
    let start=-1;
    for(let i=0;i<lines.length;i++){const s=lines[i].trim().toLowerCase().replace(/[:\-]+$/,'');if(lower.some(l=>s===l||s.startsWith(l+':'))){start=i+1;break;}}
    if(start<0)return '';
    const out=[];
    for(let i=start;i<lines.length;i++){
      const line=lines[i].trim();
      if(!line){if(out.length)out.push('');continue;}
      if(out.length&&line.length<70&&/^[A-Z][A-Za-z &/()\-]{2,}:?$/.test(line))break;
      out.push(line);
      if(out.join('\n').length>3500)break;
    }
    return out.join('\n').trim();
  }
  function bullets(block){return String(block||'').split(/\r?\n/).map(x=>x.replace(/^\s*(?:[-•*]|\d+[.)])\s*/,'').trim()).filter(x=>x.length>8).slice(0,12);}
  function detectFields(text){
    const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const joined=lines.join('\n');
    const codeMatch=joined.match(/\b([A-Z]{2,6})\s*[- ]?\s*(\d{3,4}[A-Z]?)\b/);
    const code=codeMatch?`${codeMatch[1]} ${codeMatch[2]}`:'';
    let title='';
    if(codeMatch){const line=lines.find(x=>x.includes(codeMatch[0]));if(line)title=line.replace(codeMatch[0],'').replace(/^\s*[:\-–—|]\s*/,'').trim();}
    if(!title)title=lines.find(x=>x.length>8&&x.length<100&&!/syllabus|university|college|department|semester|fall|spring|summer/i.test(x))||'';
    const institution=lines.find(x=>/\b(university|college|institute|school)\b/i.test(x)&&x.length<120)||'';
    const credit=joined.match(/\b(\d(?:\.\d)?)\s*(?:credit(?:s| hours?)?)\b/i);
    const delivery=/\bonline\b/i.test(joined)?'Online':/\bhybrid\b/i.test(joined)?'Hybrid':/\bin[- ]person|face[- ]to[- ]face\b/i.test(joined)?'In-Person':'';
    const audience=/graduate students?/i.test(joined)?'Graduate learners':/first[- ]year|freshmen|freshman/i.test(joined)?'First-year undergraduate students':/undergraduate/i.test(joined)?'Undergraduate learners':/k-?12/i.test(joined)?'K-12 learners':'';
    const description=sectionText(joined,['course description','catalog description','description']);
    const outcomeBlock=sectionText(joined,['student learning outcomes','learning outcomes','course learning outcomes','course outcomes','objectives']);
    const policyBlock=sectionText(joined,['course policies','policies','academic integrity','ai policy','artificial intelligence policy']);
    return {code,title,institution,credits:credit?credit[1]:'',defaultDeliveryMode:delivery,audience,description:description.slice(0,1600),outcomes:bullets(outcomeBlock),policies:bullets(policyBlock)};
  }
  function nonempty(v){return Array.isArray(v)?v.length>0:String(v??'').trim().length>0;}
  function applyDetected(text,fileName){
    const found=detectFields(text),applied=[];
    data.source ||= {};
    data.source.detectedFields=found;data.source.lastAnalyzedAt=now();
    data.source.documents ||= [];
    if(fileName&&!data.source.documents.some(x=>x.name===fileName))data.source.documents.push({name:fileName,importedAt:now(),characters:String(text||'').length});
    Object.entries(found).forEach(([key,val])=>{if(!nonempty(val)||nonempty(data.profile?.[key]))return;data.profile[key]=val;applied.push(key);});
    save();
    if(applied.length)toast(`Source ready. CourseBuild filled ${applied.length} empty course field${applied.length===1?'':'s'} from the document.`);
    else toast('Source ready. CourseBuild analyzed the document without overwriting existing course information.');
    return {found,applied};
  }

  async function extractPdf(file){
    if(!window.pdfjsLib)throw new Error('PDF reader did not load. Refresh the page and try again.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const doc=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const pages=[];
    for(let p=1;p<=doc.numPages;p++){
      const page=await doc.getPage(p), content=await page.getTextContent();
      pages.push(content.items.map(i=>i.str).join(' '));
    }
    const text=pages.join('\n\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    if(text.length<30)throw new Error('CourseBuild found too little readable text. This PDF may be scanned or image-only.');
    return text;
  }
  function installSourcePipeline(){
    const base=window.handleFile;if(typeof base!=='function')return;
    window.handleFile=async function(file){
      if(!file)return;
      const previous=clone(data.source||{}),name=String(file.name||''),lower=name.toLowerCase();
      try{
        if(lower.endsWith('.pdf')||file.type==='application/pdf'){
          const text=await extractPdf(file);
          data.source={...data.source,text,digest:'',fileName:name,importedAt:now(),importMode:'PDF text extraction'};
          invalidateArchitecture();save();renderPlan();applyDetected(text,name);renderAll();showView('plan');return;
        }
        await base(file);
        if((data.source?.fileName===name||lower.endsWith('.docx'))&&String(data.source?.text||'').trim()){
          applyDetected(data.source.text,name);renderAll();showView('plan');
        }
      }catch(e){data.source=previous;save();renderAll();showView('plan');toast(`We couldn't read this document. Your existing course and Blueprint were not changed. ${e.message||''}`);}
    };
  }

  function decorateSetup(){
    const host=q('#profile');if(!host)return;
    q('.cb-document-intelligence',host)?.remove();
    const d=data.source?.detectedFields,docs=data.source?.documents||[];
    if(!d&&!docs.length)return;
    const filled=Object.entries(d||{}).filter(([,v])=>nonempty(v));
    const box=document.createElement('section');box.className='panel cb-document-intelligence';
    box.innerHTML=`<div class="cb-di-head"><div><span>Document intelligence</span><h3>Course information found in your source material</h3><p>CourseBuild fills empty fields only. Existing instructor-entered values are never replaced automatically.</p></div><strong>${filled.length}</strong></div>${docs.length?`<div class="cb-doc-list">${docs.map(x=>`<span>${safe(x.name)}<small>${Number(x.characters||0).toLocaleString()} characters</small></span>`).join('')}</div>`:''}<details><summary>Review detected information</summary><dl class="cb-detected">${filled.map(([k,v])=>`<div><dt>${safe(k.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase()))}</dt><dd>${safe(Array.isArray(v)?v.join(' · '):v)}</dd></div>`).join('')}</dl></details>`;
    const form=q('#rc3ProfileForm',host);form?.parentNode?.insertBefore(box,form);
  }

  function courseSnapshot(meta){
    let env=null;try{env=JSON.parse(localStorage.getItem(`coursebuild.project.v1.${meta.id}`)||'null');}catch(e){}
    const state=env?.courseState||{},p=state.profile||{},items=state.items||[];
    const keys=['code','title','institution','credits','defaultDeliveryMode','audience','description','outcomes','policies'];
    const setup=keys.filter(k=>nonempty(p[k])).length/keys.length;
    const blueprint=state.architecture?.status==='Approved';
    const reviewed=items.length?items.filter(i=>i.generation?.state==='Approved'||i.status==='Approved').length/items.length:0;
    const score=Math.round(setup*30+(blueprint?30:0)+reviewed*40);
    return {meta,state,p,items,score,blueprint,reviewedCount:items.filter(i=>i.generation?.state==='Approved'||i.status==='Approved').length};
  }
  function canvasCounts(){
    const overview=data.canvasOverview||{};return overview.counts||{};
  }
  function localTypeCounts(){const out={Page:0,Assignment:0,Discussion:0,File:0,Quiz:0};(data.items||[]).forEach(i=>{if(Object.prototype.hasOwnProperty.call(out,i.type))out[i.type]++;});return out;}
  async function refreshCanvasOverview(){
    const status=q('#cbCanvasRefreshState');if(status)status.textContent='Refreshing Canvas…';
    if(!isVerified()){if(status)status.textContent='Verify the Canvas destination first.';return;}
    try{
      const out=await api('getCanvasCourseOverview',{});
      data.canvasOverview={courseId:String(out.courseId||settings.canvasCourseId||''),courseName:out.courseName||canvasState().courseName||'',counts:out.counts||{},unpublished:Number(out.unpublished||0),updatedAt:now()};save();renderCommandCenter();
    }catch(e){if(status)status.textContent=`Live Canvas inventory is unavailable from the current CourseBuild service. ${e.message||''}`;}
  }
  function renderCommandCenter(){
    const host=q('#projects');if(!host||!window.CourseBuildProjects)return;
    const list=CourseBuildProjects.list(),snapshots=list.map(courseSnapshot),activeId=CourseBuildProjects.currentId();
    const active=snapshots.find(x=>x.meta.id===activeId)||snapshots[0];
    const reviewNeeded=active?.items?.filter(i=>!(i.generation?.state==='Approved'||i.status==='Approved')).length||0;
    const health=typeof window.CourseBuildCourseIntelligence?.analyze==='function'?window.CourseBuildCourseIntelligence.analyze():null;
    const verification=canvasState(),local=localTypeCounts(),live=canvasCounts(),canvasReady=isVerified();
    const avg=snapshots.length?Math.round(snapshots.reduce((a,x)=>a+x.score,0)/snapshots.length):0;
    const courseCards=snapshots.map(x=>`<article class="cb-command-course ${x.meta.id===activeId?'active':''}"><div><span>${safe(x.p.code||'Course')}</span><h3>${safe(x.p.title||x.meta.name||'Untitled course')}</h3></div><strong>${x.score}%</strong><div class="cb-command-bar"><i style="width:${x.score}%"></i></div><p>${x.blueprint?'Blueprint approved':'Blueprint draft'} · ${x.reviewedCount}/${x.items.length} reviewed</p><button data-cb-open-course="${safe(x.meta.id)}" ${x.meta.id===activeId?'disabled':''}>${x.meta.id===activeId?'Current course':'Open course'}</button></article>`).join('');
    host.innerHTML=`<div class="section-head rc3-head cb-command-head"><div><p class="eyebrow">Command center</p><h2>My courses</h2><p>One view of course-building progress, instructional readiness, and the verified Canvas destination.</p></div><button class="primary" id="cbNewCourse">+ New course</button></div>
      <section class="cb-command-kpis"><article><span>Courses</span><strong>${snapshots.length}</strong><small>${avg}% average readiness</small></article><article><span>Needs review</span><strong>${reviewNeeded}</strong><small>Current course items</small></article><article><span>Course health</span><strong>${health?.score??'—'}${health?.score!=null?'%':''}</strong><small>${health?`${health.blockers?.length||0} blockers`:'Open Course health for analysis'}</small></article><article class="${canvasReady?'good':'warn'}"><span>Canvas</span><strong>${canvasReady?'Connected':'Not verified'}</strong><small>${safe(verification.courseName||'Destination verification required')}</small></article></section>
      <div class="cb-command-grid"><section class="panel cb-command-courses"><div class="cb-panel-head"><div><span>Portfolio</span><h3>Your courses</h3></div></div><div class="cb-command-course-grid">${courseCards||'<p>No courses yet.</p>'}</div></section>
      <section class="panel cb-canvas-center"><div class="cb-panel-head"><div><span>Canvas command center</span><h3>${canvasReady?safe(verification.courseName||'Verified Canvas course'):'Connect CourseBuild to Canvas'}</h3><p>${canvasReady?'Compare the CourseBuild plan with the live Canvas course from one place.':'CourseBuild will never present configured credentials as a working Canvas connection.'}</p></div><button id="cbRefreshCanvas" ${!canvasReady?'disabled':''}>Refresh Canvas</button></div><p id="cbCanvasRefreshState" class="hint">${data.canvasOverview?.updatedAt?`Last refreshed ${safe(new Date(data.canvasOverview.updatedAt).toLocaleString())}`:canvasReady?'Ready to load live Canvas inventory.':'Verify Canvas in Settings to enable live inventory.'}</p><div class="cb-inventory"><div class="cb-inventory-head"><span>Type</span><span>CourseBuild</span><span>Canvas</span></div>${['Page','Assignment','Discussion','File','Quiz'].map(t=>`<div><strong>${t}${t==='Page'?'s':'s'}</strong><span>${local[t]||0}</span><span>${live[t]??'—'}</span></div>`).join('')}</div>${canvasReady&&data.canvasOverview?`<div class="cb-canvas-summary"><span>Canvas course ID <strong>${safe(data.canvasOverview.courseId)}</strong></span><span>Unpublished <strong>${Number(data.canvasOverview.unpublished||0)}</strong></span></div>`:''}</section></div>`;
    q('#cbNewCourse')?.addEventListener('click',()=>q('#newProjectQuick')?.click());
    qa('[data-cb-open-course]',host).forEach(b=>b.onclick=()=>{const sel=q('#projectSwitcher');if(sel){sel.value=b.dataset.cbOpenCourse;sel.dispatchEvent(new Event('change'));}});
    q('#cbRefreshCanvas')?.addEventListener('click',refreshCanvasOverview);
  }

  function install(){
    installSourcePipeline();
    const setupBase=window.renderProfile;if(typeof setupBase==='function')window.renderProfile=function(){setupBase();decorateSetup();};
    if(window.CourseBuildProjects)window.CourseBuildProjects.render=renderCommandCenter;
    window.CourseBuildCommandCenter={render:renderCommandCenter,refreshCanvasOverview,detectFields,applyDetected};
    renderCommandCenter();decorateSetup();
  }
  window.addEventListener('load',()=>setTimeout(install,80));
})();
