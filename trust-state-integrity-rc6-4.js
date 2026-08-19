/* CourseBuild RC6.4 — Trust-State Integrity
   Core behavioral patch. No visual-system overrides. */
(function(){
  const M=window.CourseBuildTrustModel;
  if(!M)return;
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const now=()=>new Date().toISOString();
  const safe=v=>esc(v??'');

  const legacySave=save;
  const legacyRenderPlan=renderPlan;
  const legacyRenderReview=renderReview;
  const legacyApplyArchitecture=applyArchitecture;

  function syncLegacyStatus(item){
    M.normalizeItem(item);
    const g=item.generation.state;
    item.status=g==='Needs review'?'Needs Review':g==='Generation failed'?'Generation Failed':g;
    if(g==='Not generated')item.status='Planned';
  }
  function normalizeTrustState(){
    data.architecture ||= {status:'Draft',approvedAt:'',approvedBy:'Instructor'};
    data.architecture.generation ||= {state:(data.modules?.length?'Needs review':'Not generated'),error:'',updatedAt:''};
    (data.items||[]).forEach(i=>{M.normalizeItem(i);syncLegacyStatus(i);});
    settings.canvasVerification=M.normalizedCanvasVerification(settings);
  }
  save=function(){normalizeTrustState();legacySave();};
  normalizeTrustState();
  legacySave();
  saveSettings();

  invalidateArchitecture=function(){
    const generation=data.architecture?.generation||{state:'Not generated',error:'',updatedAt:''};
    data.architecture={status:'Draft',approvedAt:'',approvedBy:'Instructor',generation};
    (data.items||[]).forEach(i=>{
      M.normalizeItem(i);
      if(i.generation.state==='Approved'){
        i.generation.state='Needs review';i.generation.updatedAt=now();syncLegacyStatus(i);
      }
      if(i.publish.state==='Verified'){
        i.publish.state='Sent / unverified';
        i.publish.verificationError='CourseBuild content changed after verification. Publish again to verify the current version.';
        i.publish.verifiedAt='';i.publish.updatedAt=now();
      }
    });
  };

  patchItem=function(id,p){
    const i=data.items.find(x=>x.id===id);if(!i)return;
    M.normalizeItem(i);Object.assign(i,p);i.draftHtml='';
    i.generation={state:'Not generated',error:'',updatedAt:now()};
    if(i.publish.canvasId){i.publish.state='Sent / unverified';i.publish.verificationError='CourseBuild content changed after the last Canvas verification.';i.publish.verifiedAt='';}
    else i.publish={...i.publish,state:'Not sent',error:'',verificationError:'',verifiedAt:''};
    syncLegacyStatus(i);invalidateArchitecture();save();renderPlan();
  };

  approveArchitecture=function(){
    if(!data.modules.length||!data.items.length)return toast('Add at least one module and course item first.');
    if(data.items.some(i=>!i.title||!i.purpose||!moduleFor(i)))return toast('Every course item needs a title, purpose, and module.');
    const generation=data.architecture?.generation||{state:'Needs review',error:'',updatedAt:now()};
    data.architecture={status:'Approved',approvedAt:now(),approvedBy:'Instructor',generation};
    save();renderAll();toast('Blueprint approved.');
  };

  generateArchitecture=async function(){
    const source=q('#sourceText');const text=String(source?.value||data.source?.text||'').trim();
    if(text.length<80)return toast('Paste more source material first.');
    data.source.text=text;
    data.architecture.generation={state:'Generating',error:'',updatedAt:now()};save();renderPlan();
    try{
      const out=await api('generateCourseArchitecture',{sourceText:text});
      if(!out||!Array.isArray(out.modules)||!out.modules.length||!Array.isArray(out.items)||!out.items.length)throw new Error('Generation returned no usable course structure.');
      legacyApplyArchitecture(out,'AI architecture');
      data.architecture.generation={state:'Needs review',error:'',updatedAt:now()};
      data.source.digest=out.sourceDigest||text.slice(0,12000);data.source.importMode='AI architecture';
      save();renderAll();showView('plan');toast(`Blueprint proposed: ${data.modules.length} modules, ${data.items.length} items.`);
    }catch(e){
      data.architecture.generation={state:'Generation failed',error:e.message||'Blueprint generation failed.',updatedAt:now()};
      save();renderAll();showView('plan');toast(`Blueprint generation failed: ${e.message||'Unknown error'}`);
    }
  };

  generateItem=async function(id){
    if(data.architecture.status!=='Approved')return toast('Approve the Blueprint first.');
    const i=data.items.find(x=>x.id===id);if(!i)return;
    M.normalizeItem(i);i.generation={state:'Generating',error:'',updatedAt:now()};syncLegacyStatus(i);save();renderAll();showView('review');
    try{
      const out=await api('generateItem',{item:i,module:moduleFor(i),outcomes:data.profile.outcomes||[],sourceText:data.source.digest||data.source.text||''});
      const draft=String(out?.draftHtml||out?.html||'').trim();if(!draft)throw new Error('Generation returned an empty draft.');
      i.draftHtml=draft;i.generation={state:'Needs review',error:'',updatedAt:now()};syncLegacyStatus(i);save();renderAll();showView('review');toast('Draft ready for review.');
    }catch(e){
      i.generation={state:'Generation failed',error:e.message||'Generation failed.',updatedAt:now()};syncLegacyStatus(i);save();renderAll();showView('review');toast(`Generation failed: ${e.message||'Unknown error'}`);
    }
  };

  approveItem=function(id){
    const i=data.items.find(x=>x.id===id);if(!i)return;M.normalizeItem(i);
    if(i.generation.state!=='Needs review'||!String(i.draftHtml||'').trim())return toast('A successful draft must be reviewed before approval.');
    i.generation={state:'Approved',error:'',updatedAt:now()};syncLegacyStatus(i);save();renderAll();showView('review');toast('Item approved.');
  };

  renderPlan=function(){
    legacyRenderPlan();
    const host=q('#plan');if(!host)return;const g=data.architecture?.generation||{state:'Not generated'};
    const source=q('.rc3-source',host)||q('.panel',host);if(!source)return;
    q('[data-rc64-generation]',host)?.remove();
    if(g.state==='Generating')source.insertAdjacentHTML('beforeend','<p data-rc64-generation role="status"><strong>Generating Blueprint…</strong> CourseBuild has not changed the current Blueprint yet.</p>');
    if(g.state==='Generation failed')source.insertAdjacentHTML('beforeend',`<p data-rc64-generation role="alert"><strong>Blueprint generation failed.</strong> ${safe(g.error||'No Blueprint was created from this attempt.')} Retry when ready.</p>`);
    const b=q('#architectBtn',host);if(b&&g.state==='Generation failed')b.textContent='Retry Blueprint generation';
  };

  renderReview=function(){
    legacyRenderReview();
    const host=q('#review');if(!host)return;const i=data.items.find(x=>x.id===selectedItemId)||data.items[0];if(!i)return;M.normalizeItem(i);
    const gen=i.generation;
    const generate=q('#generateBtn',host),approve=q('#approveBtn',host);
    if(generate){generate.disabled=gen.state==='Generating';generate.textContent=gen.state==='Generation failed'?'Retry generation':gen.state==='Generating'?'Generating…':'Generate draft';}
    if(approve)approve.disabled=gen.state!=='Needs review'||!String(i.draftHtml||'').trim();
    q('[data-rc64-generation]',host)?.remove();
    const draft=q('.draft',host)?.closest('.panel');
    if(draft&&gen.state==='Generation failed')draft.insertAdjacentHTML('afterbegin',`<p data-rc64-generation role="alert"><strong>Generation failed.</strong> ${safe(gen.error||'No successful draft was produced.')} Use Retry generation to try again.</p>`);
    else if(draft&&gen.state==='Generating')draft.insertAdjacentHTML('afterbegin','<p data-rc64-generation role="status"><strong>Generating…</strong> This item is not ready for review yet.</p>');
  };

  function canvasVerification(){settings.canvasVerification=M.normalizedCanvasVerification(settings);return settings.canvasVerification;}
  function canvasVerified(){return M.isCanvasVerified(settings);}

  verifyCanvasConnection=async function(){
    if(!M.canvasConfigPresent(settings)){settings.canvasVerification=M.normalizedCanvasVerification(settings);saveSettings();renderSettings();return toast('Add the backend URL, Canvas URL, and course ID first.');}
    settings.canvasVerification={state:'Configured, unverified',courseId:String(settings.canvasCourseId),courseName:'',courseUrl:'',verifiedAt:'',error:''};saveSettings();renderSettings();
    try{
      const out=await api('verifyCanvasConnection',{});
      const courseId=String(out?.courseId||out?.id||'');const courseName=String(out?.courseName||out?.name||'').trim();
      if(!courseId||!courseName)throw new Error('Canvas verification did not return a course identity.');
      if(courseId!==String(settings.canvasCourseId))throw new Error(`Canvas returned course ${courseId}, not configured course ${settings.canvasCourseId}.`);
      settings.canvasVerification={state:'Connected and verified',courseId,courseName,courseUrl:out.courseUrl||out.htmlUrl||'',verifiedAt:now(),error:''};saveSettings();renderAll();toast(`Canvas verified: ${courseName}.`);
    }catch(e){settings.canvasVerification={state:'Connection failed',courseId:String(settings.canvasCourseId),courseName:'',courseUrl:'',verifiedAt:'',error:e.message||'Canvas connection failed.'};saveSettings();renderAll();toast(`Canvas verification failed: ${e.message||'Unknown error'}`);}
  };

  renderSettings=function(){
    const v=canvasVerification();const configured=M.canvasConfigPresent(settings);
    const destination=v.state==='Connected and verified'?`<p role="status"><strong>Verified destination:</strong> ${safe(v.courseName)} · Course ${safe(v.courseId)}${v.verifiedAt?` · ${safe(new Date(v.verifiedAt).toLocaleString())}`:''}</p>`:'';
    const error=v.state==='Connection failed'?`<p role="alert"><strong>Connection failed:</strong> ${safe(v.error)}</p>`:'';
    q('#settings').innerHTML=`<div class="section-head"><div><p class="eyebrow">Canvas connection</p><h2>Connect and verify the destination</h2><p>Configuration is not treated as a working connection until Canvas returns the actual course identity.</p></div>${badge(v.state)}</div><form id="settingsForm" class="panel form"><label>Apps Script Web App URL<input name="appsScriptUrl" value="${safe(settings.appsScriptUrl||'')}"></label><label>Canvas Base URL<input name="canvasBaseUrl" value="${safe(settings.canvasBaseUrl||'')}"></label><label>Canvas Course ID<input name="canvasCourseId" value="${safe(settings.canvasCourseId||'')}"></label>${destination}${error}<div class="actions"><button type="submit">Save settings</button><button type="button" id="verifyCanvasBtn" class="primary" ${!configured?'disabled':''}>Verify Canvas connection</button></div></form>`;
    q('#settingsForm').onsubmit=e=>{e.preventDefault();const previous={appsScriptUrl:settings.appsScriptUrl||'',canvasBaseUrl:settings.canvasBaseUrl||'',canvasCourseId:settings.canvasCourseId||''};const next=Object.fromEntries(new FormData(e.currentTarget).entries());settings={...settings,...next};const changed=previous.appsScriptUrl!==settings.appsScriptUrl||previous.canvasBaseUrl!==settings.canvasBaseUrl||previous.canvasCourseId!==settings.canvasCourseId;if(changed)settings.canvasVerification=M.normalizedCanvasVerification({...settings,canvasVerification:{}});saveSettings();renderAll();toast('Settings saved. Canvas must be verified before publishing.');};
    q('#verifyCanvasBtn')?.addEventListener('click',verifyCanvasConnection);
  };

  readinessChecks=function(){
    normalizeTrustState();
    return[
      {label:'Course title and description',pass:Boolean(data.profile.title&&data.profile.description)},
      {label:'Learning outcomes',pass:Boolean((data.profile.outcomes||[]).length)},
      {label:'Source retained or digested',pass:Boolean(data.source.text||data.source.digest)},
      {label:'Blueprint exists',pass:Boolean(data.modules.length&&data.items.length)},
      {label:'Blueprint explicitly approved',pass:data.architecture.status==='Approved'},
      {label:'Every item belongs to a module',pass:data.items.length>0&&data.items.every(i=>moduleFor(i))},
      {label:'Every item has a purpose',pass:data.items.length>0&&data.items.every(i=>String(i.purpose||'').trim())},
      {label:'All generated content approved',pass:data.items.length>0&&data.items.every(i=>M.generationApproved(i))},
      {label:'Canvas destination connected and verified',pass:canvasVerified()}
    ];
  };

  async function verifyPublishedItem(item){
    M.normalizeItem(item);
    const out=await api('verifyPublishedItem',{item:{id:item.id,type:item.type,title:item.title,purpose:item.purpose,points:item.points,coursebuildKey:item.coursebuildKey},module:moduleFor(item),canvasId:item.publish.canvasId,expectedCoursebuildKey:item.coursebuildKey,expectedTitle:item.title});
    if(!M.publishedReadbackMatches(item,out))throw new Error(out?.error||'Canvas read-back did not match the intended CourseBuild object.');
    item.publish.state='Verified';item.publish.error='';item.publish.verificationError='';item.publish.verifiedAt=now();item.publish.updatedAt=now();item.canvasId=item.publish.canvasId;item.canvasUrl=item.publish.canvasUrl;save();return out;
  }

  async function publishOne(item){
    M.normalizeItem(item);
    if(!M.generationApproved(item))return{ok:false,error:'Item is not approved.'};
    if(!canvasVerified())return{ok:false,error:'Canvas destination is not verified.'};
    if(item.publish.state==='Verified')return{ok:true,verified:true};
    if(item.publish.canvasId&&(item.publish.state==='Sent / unverified'||item.publish.state==='Failed')){
      try{await verifyPublishedItem(item);return{ok:true,verified:true};}catch(e){item.publish.verificationError=e.message||'Verification failed.';item.publish.updatedAt=now();save();}
    }
    item.publish.state='Publishing';item.publish.error='';item.publish.verificationError='';item.publish.updatedAt=now();save();renderBuild();
    try{
      const out=await api('publishItem',{item,module:moduleFor(item),idempotencyKey:item.coursebuildKey,existingCanvasId:item.publish.canvasId||'',coursebuildKey:item.coursebuildKey});
      const canvasId=String(out?.canvasId||out?.id||'');if(!canvasId)throw new Error('Canvas publish returned no object ID.');
      item.publish.state='Sent / unverified';item.publish.canvasId=canvasId;item.publish.canvasUrl=out.canvasUrl||out.htmlUrl||'';item.publish.updatedAt=now();item.canvasId=canvasId;item.canvasUrl=item.publish.canvasUrl;save();renderBuild();
      try{await verifyPublishedItem(item);return{ok:true,verified:true};}
      catch(e){item.publish.state='Sent / unverified';item.publish.verificationError=e.message||'Read-back verification failed.';item.publish.updatedAt=now();save();return{ok:false,sent:true,error:item.publish.verificationError};}
    }catch(e){item.publish.state='Failed';item.publish.error=e.message||'Publish failed.';item.publish.updatedAt=now();save();return{ok:false,error:item.publish.error};}
  }

  sendApproved=async function(){
    if(!readinessChecks().every(x=>x.pass))return toast('Resolve Canvas Readiness issues before publishing.');
    const targets=data.items.filter(i=>M.generationApproved(i)&&!M.publishVerified(i));if(!targets.length)return toast('All approved items are already verified in Canvas.');
    let verified=0,failed=0,unverified=0;
    for(const item of targets){const result=await publishOne(item);if(result.verified)verified++;else if(result.sent)unverified++;else failed++;renderBuild();}
    renderAll();showView('build');toast(`Canvas run complete: ${verified} verified · ${unverified} sent/unverified · ${failed} failed.`);
  };

  renderBuild=function(){
    const checks=readinessChecks(),passed=checks.filter(x=>x.pass).length,ready=checks.every(x=>x.pass);const v=canvasVerification();
    const approved=data.items.filter(i=>M.generationApproved(i)).length,verified=data.items.filter(i=>M.publishVerified(i)).length;
    q('#build').innerHTML=`<div class="section-head"><div><p class="eyebrow">Canvas Readiness</p><h2>Verify before CourseBuild calls work complete.</h2><p>Approved content and configured settings are not treated as proof that Canvas changed successfully.</p></div>${badge(ready?'Ready to publish':'Not ready')}</div><div class="cards"><article class="card"><span>Readiness checks</span><strong>${passed}/${checks.length}</strong></article><article class="card"><span>Approved content</span><strong>${approved}/${data.items.length}</strong></article><article class="card"><span>Canvas verified</span><strong>${verified}/${data.items.length}</strong></article></div><article class="panel"><h3>Readiness audit</h3><div class="check-list">${checks.map(x=>`<div class="check-row"><span class="check-icon">${x.pass?'✓':'!'}</span><span>${safe(x.label)}</span>${badge(x.pass?'Pass':'Needs attention')}</div>`).join('')}</div>${v.state==='Connected and verified'?`<p class="hint">Verified destination: ${safe(v.courseName)} · Course ${safe(v.courseId)} · ${safe(new Date(v.verifiedAt).toLocaleString())}</p>`:''}</article><article class="panel"><h3>Per-object publish state</h3>${data.modules.map(m=>`<div class="build-module"><b>${safe(m.title)}</b>${data.items.filter(i=>i.moduleId===m.id).map(i=>{M.normalizeItem(i);const retry=i.publish.state==='Failed'||i.publish.state==='Sent / unverified';const msg=i.publish.error||i.publish.verificationError;return`<div class="build-row"><span>${safe(i.type)} · ${safe(i.title)}<small style="display:block">Generation: ${safe(i.generation.state)} · Canvas: ${safe(i.publish.state)}${msg?` · ${safe(msg)}`:''}</small></span><span>${badge(i.publish.state)}${retry?` <button data-rc64-retry="${safe(i.id)}">Retry / verify</button>`:''}</span></div>`;}).join('')}</div>`).join('')}<div class="actions"><button id="sendApproved" class="primary" ${!ready||approved===0?'disabled':''}>Publish approved items + verify</button></div></article><details class="rc3-advanced-build"><summary>What verification means</summary><p>CourseBuild first sends the approved object, records it as Sent / unverified, then asks the backend to read that Canvas object back and match it to the intended CourseBuild identity. Only then does it become Verified.</p></details>`;
    q('#sendApproved')?.addEventListener('click',sendApproved);qa('[data-rc64-retry]',q('#build')).forEach(b=>b.onclick=async()=>{const i=data.items.find(x=>x.id===b.dataset.rc64Retry);if(!i)return;await publishOne(i);renderAll();showView('build');});
    setTimeout(correctLegacyTrustChrome,0);
  };

  let observer;
  function correctLegacyTrustChrome(){
    observer?.disconnect();
    try{
      const verified=canvasVerified();const v=canvasVerification();
      qa('.rc5-trust-bar span').forEach(s=>{if(/^Canvas /i.test(s.textContent||'')){const text=verified?'Canvas verified':v.state;if(s.textContent!==text)s.textContent=text;}});
      const canvasLi=q('.rc5-home-status li:last-child');if(canvasLi){canvasLi.classList.toggle('done',verified);const i=q('i',canvasLi);const mark=verified?'✓':'•';if(i&&i.textContent!==mark)i.textContent=mark;}
      const items=data.items||[],reviewed=items.filter(i=>M.generationApproved(i)).length;const setupKeys=['code','title','institution','credits','defaultDeliveryMode','audience','description','outcomes','policies'];const setup=setupKeys.filter(k=>Array.isArray(data.profile?.[k])?data.profile[k].length:String(data.profile?.[k]??'').trim()).length===setupKeys.length;const milestones=[setup,data.architecture?.status==='Approved',items.length>0&&reviewed===items.length,verified];const progress=Math.round(milestones.filter(Boolean).length/milestones.length*100);
      const cmd=q('.cdo-command');if(cmd){const strong=q('.cdo-command-progress strong',cmd),bar=q('.cdo-command-progress i b',cmd);const pct=`${progress}%`;if(strong&&strong.textContent!==pct)strong.textContent=pct;if(bar&&bar.style.width!==pct)bar.style.width=pct;if(setup&&data.architecture?.status==='Approved'&&items.length&&reviewed===items.length&&!verified){const n=q('.cdo-command-next',cmd),b=q('.cdo-command-action',cmd);if(n){const ns=q('strong',n),small=q('small',n);if(ns&&ns.textContent!=='Verify Canvas connection')ns.textContent='Verify Canvas connection';if(small&&small.textContent!==v.state)small.textContent=v.state;}if(b){b.dataset.cdoJump='settings';if(b.textContent!=='Go to Settings →')b.textContent='Go to Settings →';}}}
      const trust=q('.cdo-trust-panel');if(trust)trust.classList.toggle('ready',verified&&data.architecture?.status==='Approved'&&items.length&&reviewed===items.length);
      if(setup&&data.architecture?.status==='Approved'&&items.length&&reviewed===items.length&&!verified){const next=q('.rc5-next');if(next){const ns=q('strong',next),p=q('p',next),b=q('button',next),detail=`${v.state}. Verify the destination before preflight.`;if(ns&&ns.textContent!=='Canvas connection')ns.textContent='Canvas connection';if(p&&p.textContent!==detail)p.textContent=detail;if(b){b.dataset.rc5Next='settings';b.onclick=()=>q('.steps button[data-view="settings"]')?.click();}}}
    }finally{
      if(document.body)observer?.observe(document.body,{subtree:true,childList:true});
    }
  }

  observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(correctLegacyTrustChrome,60);});
  window.addEventListener('load',()=>{normalizeTrustState();save();saveSettings();renderAll();correctLegacyTrustChrome();});
  document.addEventListener('click',()=>setTimeout(correctLegacyTrustChrome,120),true);
  window.CourseBuildTrustState={normalizeTrustState,canvasVerification,canvasVerified,publishOne,verifyPublishedItem,correctLegacyTrustChrome};
})();
