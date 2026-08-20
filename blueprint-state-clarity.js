/* CourseBuild — Blueprint approved-state clarity */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];

  function isPlanVisible(){
    const host=q('#plan');
    return host && !host.classList.contains('hidden');
  }

  function render(){
    const host=q('#plan');
    if(!host || typeof data==='undefined')return;

    const approved=data.architecture?.status==='Approved';
    const modules=(data.modules||[]).length;
    const items=(data.items||[]).length;
    const needsReview=(data.items||[]).filter(item=>item.status!=='Approved').length;

    /* RC5's two introductory cards repeat the same concept. Keep the course map
       as the visual explanation and turn the state card into one concise status. */
    const intro=q('.rc5-blueprint-intro',host);
    if(intro){
      const lead=q(':scope > div:first-child',intro);
      const state=q('.rc5-blueprint-state',intro);
      if(lead){
        lead.innerHTML=`<span>Blueprint</span><h3>${approved?'Blueprint approved':'Review your course structure'}</h3><p>${modules} module${modules===1?'':'s'} · ${items} course item${items===1?'':'s'}${approved&&needsReview?` · ${needsReview} item${needsReview===1?'':'s'} will need content review next`:''}</p>`;
      }
      if(state){
        state.innerHTML=approved
          ? '<strong>Approved ✓</strong><span>Your course structure is approved. Editing the structure will return the Blueprint to draft status.</span>'
          : '<strong>Draft</strong><span>Review the structure below, then approve it when it is ready.</span>';
      }
    }

    /* Do not offer an approval action for an already-approved Blueprint. */
    const approve=q('#approveArchitecture',host);
    if(approve){
      if(approved){
        approve.hidden=true;
        approve.setAttribute('aria-hidden','true');
      }else{
        approve.hidden=false;
        approve.removeAttribute('aria-hidden');
        approve.textContent='Approve blueprint';
      }
    }

    /* RC4/other layers can surface duplicate approval controls. Suppress only
       controls whose visible label is the approval action, never unrelated UI. */
    if(approved){
      qa('button',host).forEach(button=>{
        if(button.id==='approveArchitecture')return;
        if(/^approve blueprint$/i.test((button.textContent||'').trim())){
          button.hidden=true;
          button.setAttribute('aria-hidden','true');
        }
      });
    }

    /* The sticky mobile action should describe the next workflow stage rather
       than imply that reviewed content is a Blueprint defect. */
    if(isPlanVisible()){
      const bar=q('.rc5-mobile-action');
      if(bar && approved){
        bar.innerHTML='<span><small>Next</small><strong>Content review</strong></span><button data-blueprint-next="review">Continue</button>';
        q('[data-blueprint-next]',bar)?.addEventListener('click',()=>{
          q('.steps button[data-view="review"]')?.click();
          window.scrollTo({top:0,behavior:'smooth'});
        });
      }
    }
  }

  let timer;
  function schedule(delay=30){clearTimeout(timer);timer=setTimeout(render,delay);}
  window.addEventListener('load',()=>schedule(320));
  document.addEventListener('click',e=>{
    if(e.target.closest('.steps button,#approveArchitecture,[data-view="plan"]'))schedule(100);
  });
  const observer=new MutationObserver(()=>{
    if(isPlanVisible())schedule(40);
  });
  window.addEventListener('load',()=>observer.observe(document.body,{subtree:true,childList:true}));
})();
