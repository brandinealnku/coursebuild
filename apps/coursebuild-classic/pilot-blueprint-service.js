/* CourseBuild pilot readiness — generation service boundary */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const serviceReady=()=>Boolean(window.CourseBuildService?.generationReady?.());
  function sourceValue(){return String(q('#sourceText')?.value||data.source?.text||'').trim();}
  function createBasicBlueprint(){
    const text=sourceValue();if(text.length<80)return toast('Add more source material before creating a Blueprint.');
    const proposal=localArchitecture(text);
    applyArchitecture(proposal,'Basic source analysis (non-AI)');
    data.source.text=text;data.source.digest=proposal.sourceDigest||text.slice(0,12000);data.source.importMode='Basic source analysis (non-AI)';
    save();renderAll();showView('plan');toast(`Basic Blueprint created: ${data.modules.length} modules and ${data.items.length} items. Review every item before approval.`);
  }
  function decorate(){
    const host=q('#plan'),button=q('#architectBtn',host);if(!host||!button)return;
    q('.cb-generation-boundary',host)?.remove();
    const note=document.createElement('div');note.className='cb-generation-boundary';
    if(serviceReady()){
      note.innerHTML='<strong>CourseBuild generation service connected</strong><span>Generate Blueprint uses the CourseBuild service. Failed generation remains failed and is never replaced by hidden fallback content.</span>';
      button.textContent='Generate Blueprint';button.onclick=window.generateArchitecture;
    }else{
      const h=window.CourseBuildService?.health?.();
      note.innerHTML=`<strong>AI generation is not available${h?.state==='Unavailable'?' right now':''}</strong><span>You can create a basic Blueprint from the uploaded source. This option uses document structure only and is explicitly non-AI.</span>`;
      button.textContent='Create basic Blueprint';button.onclick=createBasicBlueprint;
    }
    const source=q('.rc3-source',host);source?.appendChild(note);
  }
  function install(){
    const base=window.renderPlan;if(typeof base==='function')window.renderPlan=function(){base();decorate();};
    window.addEventListener('coursebuild:service-health',decorate);decorate();
  }
  window.addEventListener('load',()=>setTimeout(install,120));
})();
