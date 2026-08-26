/* CourseBuild Independent User RC1 · customer-facing shell without changing the core engine */
(function(){
  const labels={projects:"My Courses",profile:"1. Course Setup",plan:"2. Course Blueprint",review:"3. Review Content",build:"4. Publish",versions:"5. Adapt",settings:"Connect Canvas"};
  const textMap=[
    ["Your CourseBuild workspace.","My Courses"],
    ["+ New project","+ Build a new course"],
    ["New CourseBuild project","New course"],
    ["Import project JSON","Import course backup"],
    ["Export current project","Back up current course"],
    ["Rename current","Rename course"],
    ["Duplicate current","Duplicate course"],
    ["Current project","Current course"],
    ["Saved project","Saved course"],
    ["Delete local","Delete from this device"],
    ["Course Profile","Course Setup"],
    ["Generation guardrails","Course rules & preferences"],
    ["Import + Architecture","Build your course blueprint"],
    ["Shape the LMS blueprint before content generation.","Turn what you already have into a course structure you can review before anything is generated."],
    ["Architecture approval","Course blueprint approval"],
    ["Approve architecture","Approve course blueprint"],
    ["Edit proposed structure","Edit your proposed course"],
    ["LMS items","Course items"],
    ["LMS item","Course item"],
    ["+ Add LMS item","+ Add course item"],
    ["Grounded source digest ready","Source analyzed"],
    ["Canvas Preview","Canvas preview"],
    ["Materialize","Publish"],
    ["Reconcile","Verify Canvas"],
    ["Reconciliation","Canvas verification"],
    ["Working Version","Course version"]
  ];

  function nav(){
    document.querySelectorAll('.steps button[data-view]').forEach(b=>{if(labels[b.dataset.view])b.textContent=labels[b.dataset.view];});
    let details=document.querySelector('.research-tools');
    if(!details){
      details=document.createElement('details');details.className='research-tools';
      details.innerHTML='<summary>Research & pilot tools</summary><p class="hint">Optional tools for structured pilot studies and aggregate evidence. Most instructors do not need these to build a course.</p><div class="actions"><button data-go="telemetry">Pilot Evidence</button><button data-go="pilot">External Pilot</button><button data-go="cohort">Pilot Cohort</button></div>';
      const steps=document.querySelector('.steps');steps?.after(details);
      details.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>document.querySelector(`.steps button[data-view="${b.dataset.go}"]`)?.click());
    }
  }

  function hero(){
    const h=document.querySelector('.hero h2');if(h)h.textContent='From what you already teach to a course ready for Canvas.';
    const p=document.querySelector('.hero > p:last-of-type');if(p)p.textContent='Upload your syllabus or course plan, review the blueprint CourseBuild proposes, approve generated content, then preview exactly what will be published.';
    if(!document.querySelector('.independent-subline')){const x=document.createElement('p');x.className='independent-subline';x.textContent='CourseBuild keeps you in control: AI proposes. You review. Nothing publishes until you approve it.';document.querySelector('.hero')?.appendChild(x);}
  }

  function replaceText(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){
      if(!n.nodeValue||!n.nodeValue.trim())continue;
      let v=n.nodeValue;
      textMap.forEach(([a,b])=>{v=v.split(a).join(b);});
      if(v!==n.nodeValue)n.nodeValue=v;
    }
  }

  function currentState(){try{return JSON.parse(localStorage.getItem('coursebuild.pilot.v4')||'null');}catch(e){return null;}}

  function decoratePlan(){
    const host=document.querySelector('#plan');if(!host)return;
    host.querySelectorAll('label').forEach(l=>{if(l.childNodes[0]?.nodeValue?.includes('Course rules & preferences'))l.title='Examples: grading policies, accessibility expectations, tone, required teaching approaches, or AI-use rules.';});
    const fallback=currentState()?.source?.importMode==='local fallback';
    let note=host.querySelector('.customer-notice[data-kind="fallback"]');
    if(fallback&&!note){note=document.createElement('div');note.className='customer-notice';note.dataset.kind='fallback';note.innerHTML='<strong>AI generation was not available.</strong><span>CourseBuild created a basic draft from headings in your source so you can keep working. This draft was not AI-analyzed. Review it carefully or try generation again when the AI service is available.</span>';host.prepend(note);} else if(!fallback&&note)note.remove();
  }

  function decorateSettings(){
    const host=document.querySelector('#settings');if(!host)return;
    let note=host.querySelector('.customer-notice[data-kind="connection"]');
    if(!note){note=document.createElement('div');note.className='customer-notice connection-notice';note.dataset.kind='connection';note.innerHTML='<strong>Canvas connection · pilot setup</strong><span>This pilot still uses one-time administrator configuration. In the production experience, instructors should connect Canvas without needing Apps Script URLs, API tokens, or backend terminology. If you are a pilot instructor, use the connection details provided by your CourseBuild administrator.</span>';host.prepend(note);}
    replaceText(host);
  }

  function decorateProjects(){
    const host=document.querySelector('#projects');if(!host)return;replaceText(host);
    const desc=host.querySelector('.section-head p');if(desc)desc.textContent='Start a new course or reopen one you have already been building. CourseBuild saves work on this device; optional managed sync can keep a pilot copy available across devices.';
    const storage=[...host.querySelectorAll('.panel h3')].find(h=>/Storage boundary/i.test(h.textContent));if(storage){const panel=storage.closest('.panel');if(panel)panel.style.display='none';}
  }

  function progress(){
    let p=document.querySelector('.workflow-progress');if(!p){p=document.createElement('div');p.className='workflow-progress';document.querySelector('.steps')?.after(p);}
    const active=document.querySelector('.steps button.active')?.dataset.view||'projects';
    const stages=[['projects','My Courses'],['profile','Setup'],['plan','Blueprint'],['review','Review'],['build','Publish']];
    p.innerHTML=stages.map(([id,label])=>`<span class="${id===active?'current':''}"><i class="dot"></i> ${label}</span>`).join('<span>→</span>');
  }

  function decorate(){nav();hero();replaceText(document.querySelector('main')||document);decorateProjects();decoratePlan();decorateSettings();progress();}
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(decorate,40);});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>{decorate();setTimeout(()=>{document.querySelector('.steps button[data-view="projects"]')?.click();decorate();},60);});
})();
