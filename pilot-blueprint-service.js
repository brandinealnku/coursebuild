/* CourseBuild pilot readiness — generation service boundary */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const serviceReady=()=>Boolean(String(settings?.appsScriptUrl||'').trim());
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
      note.innerHTML='<strong>CourseBuild generation service connected</strong><span>Generate Blueprint will use the configured service. Failed generation remains failed and will never be replaced by hidden fallback content.</span>';
      button.textContent='Generate Blueprint';
    }else{
      note.innerHTML='<strong>AI generation service is not connected</strong><span>You can still create a basic Blueprint from the uploaded source. This option uses document structure only and is explicitly non-AI.</span>';
      button.textContent='Create basic Blueprint';
      button.onclick=createBasicBlueprint;
    }
    const source=q('.rc3-source',host);source?.appendChild(note);
  }
  function install(){
    const base=window.renderPlan;if(typeof base==='function')window.renderPlan=function(){base();decorate();};
    decorate();
  }
  window.addEventListener('load',()=>setTimeout(install,120));
})();
