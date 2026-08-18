/* ITSBAD Labs × CourseBuild — education-first UX refinements */
(function(){
  function removeDuplicateHeroCopy(){
    const hero=document.querySelector('.hero');
    if(!hero)return;
    const ps=[...hero.querySelectorAll(':scope > p')].filter(p=>!p.classList.contains('eyebrow')&&!p.classList.contains('independent-subline'));
    const seen=new Set();
    ps.forEach(p=>{const key=p.textContent.trim().replace(/\s+/g,' ').toLowerCase();if(seen.has(key))p.remove();else seen.add(key);});
  }
  function refineProjectLanguage(){
    const chrome=document.querySelector('#projectChrome');
    if(!chrome)return;
    const label=chrome.querySelector('label');
    if(label&&label.firstChild)label.firstChild.nodeValue='Course';
    const btn=chrome.querySelector('#newProjectQuick');
    if(btn)btn.textContent='+ New course';
  }
  function refineResearchTools(){
    const tools=document.querySelector('.research-tools');
    if(!tools)return;
    tools.removeAttribute('open');
    const summary=tools.querySelector('summary');
    if(summary)summary.textContent='Research & pilot tools';
  }
  function refineMyCourses(){
    const host=document.querySelector('#projects');
    if(!host)return;
    const eyebrow=host.querySelector('.section-head .eyebrow');
    if(eyebrow)eyebrow.textContent='Your workspace';
    const desc=host.querySelector('.section-head p:not(.eyebrow)');
    if(desc)desc.textContent='Start a new course or continue one already in progress. CourseBuild keeps the instructional decisions visible while the system handles the build work underneath.';
  }
  function addEducationTrustLine(){
    const hero=document.querySelector('.hero');
    if(!hero||hero.querySelector('.education-trust'))return;
    const line=document.createElement('div');
    line.className='education-trust';
    line.innerHTML='<span>Built for educators</span><span>Instructor approval at every major step</span><span>Canvas-ready workflow</span>';
    hero.appendChild(line);
  }
  function addFooter(){
    if(document.querySelector('.itsbad-footer'))return;
    const footer=document.createElement('footer');
    footer.className='itsbad-footer';
    footer.innerHTML='<div><strong>CourseBuild</strong><span>An ITSBAD Labs product</span></div><p>Useful technology. Visible evidence. Human decisions.</p>';
    document.body.appendChild(footer);
  }
  function decorate(){removeDuplicateHeroCopy();refineProjectLanguage();refineResearchTools();refineMyCourses();addEducationTrustLine();addFooter();}
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(decorate,60);});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',decorate);
  decorate();
})();
