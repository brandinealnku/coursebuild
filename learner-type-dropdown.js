/* CourseBuild learner-type dropdown — progressive enhancement for Course setup */
(function(){
  const OPTIONS=[
    '',
    'Undergraduate learners',
    'First-year undergraduate students',
    'Upper-level undergraduate students',
    'Graduate students',
    'Professional or continuing education learners',
    'K-12 students',
    'Faculty or instructors',
    'Staff or employees',
    'General or public learners'
  ];

  function enhanceLearnerField(){
    const input=document.querySelector('#rc3ProfileForm input[name="audience"]');
    if(!input)return;

    const current=String(input.value||'').trim();
    const select=document.createElement('select');
    select.name='audience';
    select.setAttribute('aria-label','Type of learner');

    OPTIONS.forEach((value,index)=>{
      const option=document.createElement('option');
      option.value=value;
      option.textContent=index===0?'Select learner type…':value;
      select.appendChild(option);
    });

    if(current&&!OPTIONS.includes(current)){
      const option=document.createElement('option');
      option.value=current;
      option.textContent=current;
      select.appendChild(option);
    }

    select.value=current;
    input.replaceWith(select);
  }

  function schedule(){requestAnimationFrame(enhanceLearnerField);}
  window.addEventListener('load',schedule);
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-view="profile"],#mobileSectionSelect'))setTimeout(schedule,60);
  });

  const observer=new MutationObserver(()=>{
    if(document.querySelector('#rc3ProfileForm input[name="audience"]'))schedule();
  });
  observer.observe(document.body,{subtree:true,childList:true});
})();
