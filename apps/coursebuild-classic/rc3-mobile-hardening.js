/* CourseBuild RC3 Mobile Hardening */
(function(){
  const mq=window.matchMedia('(max-width: 680px)');
  const labels={projects:'My courses',profile:'Course setup',plan:'Blueprint',review:'Content review',build:'Canvas readiness',versions:'Adapt',settings:'Settings'};
  function ensureNav(){
    let host=document.querySelector('.mobile-section-nav');
    if(!mq.matches){host?.remove();return;}
    const steps=document.querySelector('.steps');
    if(!steps)return;
    if(!host){
      host=document.createElement('div');
      host.className='mobile-section-nav';
      host.innerHTML='<label for="mobileSectionSelect">Section</label><select id="mobileSectionSelect" aria-label="CourseBuild section"></select>';
      steps.after(host);
      const select=host.querySelector('select');
      Object.entries(labels).forEach(([id,label])=>{
        const option=document.createElement('option');option.value=id;option.textContent=label;select.appendChild(option);
      });
      select.addEventListener('change',()=>{
        const target=document.querySelector(`.steps button[data-view="${select.value}"]`);
        target?.click();
        window.scrollTo({top:0,behavior:'auto'});
      });
    }
    syncNav();
  }
  function syncNav(){
    const select=document.querySelector('#mobileSectionSelect');
    if(!select)return;
    const active=document.querySelector('.steps button.active[data-view]');
    if(active&&labels[active.dataset.view])select.value=active.dataset.view;
  }
  document.addEventListener('click',e=>{if(e.target.closest('.steps button[data-view]'))setTimeout(syncNav,0);});
  const observer=new MutationObserver(()=>{if(mq.matches){ensureNav();syncNav();}});
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  mq.addEventListener?.('change',ensureNav);
  window.addEventListener('DOMContentLoaded',ensureNav);
  window.addEventListener('load',()=>setTimeout(ensureNav,80));
})();
