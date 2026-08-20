/* CourseBuild Academy — self-guided product training using real CourseBuild workflows */
(function(){
  const INDEX_KEY='coursebuild.projects.v1';
  const ACTIVE_KEY='coursebuild.projects.active.v1';
  const LEGACY_COURSE_KEY='coursebuild.pilot.v4';
  const PROJECT_SCHEMA='coursebuild-project-v1';
  const ACADEMY_ID='coursebuild-academy-v1';
  const ACADEMY_VERSION='1.0';
  const projectKey=id=>`coursebuild.project.v1.${id}`;
  const readJson=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch(e){return fallback;}};
  const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const now=()=>new Date().toISOString();
  const q=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function academyState(){
    return {
      academy:{version:ACADEMY_VERSION,isDemo:true,resettable:true},
      profile:{
        id:ACADEMY_ID,
        title:'CourseBuild Academy',
        code:'CB 101',
        institution:'ITSBAD Labs',
        description:'A guided practice course that teaches instructors to use CourseBuild by completing authentic CourseBuild workflows.',
        audience:'',
        credits:1,
        defaultDeliveryMode:'Online',
        tone:'Clear, practical, instructor-facing',
        outcomes:[
          'Set up a reusable course profile and understand how it grounds CourseBuild decisions.',
          'Shape and approve a Blueprint before generating course content.',
          'Review AI-assisted drafts and make explicit instructor approval decisions.',
          'Use Course Health and Canvas readiness checks to identify issues before publishing.',
          'Distinguish configured, sent, and verified states when working with Canvas.',
          'Create an adapted course version without changing the master course.'
        ],
        policies:[
          'This is a training course. Do not publish to a live student course.',
          'Use a Canvas sandbox or development course for publishing practice.',
          'AI-assisted output remains a draft until the instructor approves it.',
          'Never treat configuration as proof that Canvas is connected.'
        ]
      },
      source:{
        text:'CourseBuild Academy teaches the CourseBuild workflow through practice. Module 1 covers course setup and grounding. Module 2 covers Blueprint design and approval. Module 3 covers AI-assisted content review and course health. Module 4 covers Canvas readiness, verification, publishing audit, and course adaptation. Learners should make real changes inside CourseBuild, observe how state changes, and reset the Academy whenever they want to repeat the training.',
        digest:'Guided CourseBuild product training source.',
        fileName:'coursebuild-academy-source.txt',
        importedAt:now(),
        importMode:'academy seed'
      },
      architecture:{status:'Draft',approvedAt:'',approvedBy:'Instructor'},
      modules:[
        {id:'academy-m1',order:1,title:'Start Here · Set Up the Course',summary:'Learn the CourseBuild mental model, then complete the deliberately unfinished course profile.',status:'Planned'},
        {id:'academy-m2',order:2,title:'Shape the Blueprint',summary:'Inspect, edit, and explicitly approve the proposed course structure before content generation.',status:'Planned'},
        {id:'academy-m3',order:3,title:'Review Content & Course Health',summary:'Practice instructor review of AI-assisted drafts and identify readiness issues.',status:'Planned'},
        {id:'academy-m4',order:4,title:'Canvas, Verification & Adaptation',summary:'Practice safe preflight, understand trust states, and create an adapted version.',status:'Planned'}
      ],
      items:[
        {id:'academy-i1',moduleId:'academy-m1',type:'Page',title:'How CourseBuild works',purpose:'Introduce Setup → Blueprint → Review → Canvas and explain instructor control.',points:0,status:'Approved',generation:{state:'Approved',error:'',updatedAt:now()},publish:{state:'Not sent',error:'',verificationError:'',canvasId:'',canvasUrl:'',verifiedAt:'',updatedAt:''},draftHtml:'<h2>How CourseBuild works</h2><p>CourseBuild helps instructors move from course context to a reviewable Blueprint, approved content, and verified Canvas publishing.</p>',canvasUrl:'',coursebuildKey:'coursebuild:coursebuild-academy-v1:academy-i1'},
        {id:'academy-i2',moduleId:'academy-m2',type:'Assignment',title:'Blueprint practice',purpose:'Make one intentional Blueprint change and approve the architecture.',points:10,status:'Planned',generation:{state:'Not generated',error:'',updatedAt:''},publish:{state:'Not sent',error:'',verificationError:'',canvasId:'',canvasUrl:'',verifiedAt:'',updatedAt:''},draftHtml:'',canvasUrl:'',coursebuildKey:'coursebuild:coursebuild-academy-v1:academy-i2'},
        {id:'academy-i3',moduleId:'academy-m3',type:'Discussion',title:'Improve an AI-assisted draft',purpose:'Review a deliberately imperfect draft and decide what should become approved course content.',points:10,status:'Needs Review',generation:{state:'Needs review',error:'',updatedAt:now()},publish:{state:'Not sent',error:'',verificationError:'',canvasId:'',canvasUrl:'',verifiedAt:'',updatedAt:''},draftHtml:'<h2>Technology is useful</h2><p>AI can help with courses. Discuss whether you agree.</p>',canvasUrl:'',coursebuildKey:'coursebuild:coursebuild-academy-v1:academy-i3'},
        {id:'academy-i4',moduleId:'academy-m3',type:'Assignment',title:'Course Health practice',purpose:'Use Course Health to identify what is incomplete and resolve at least one issue.',points:15,status:'Planned',generation:{state:'Not generated',error:'',updatedAt:''},publish:{state:'Not sent',error:'',verificationError:'',canvasId:'',canvasUrl:'',verifiedAt:'',updatedAt:''},draftHtml:'',canvasUrl:'',coursebuildKey:'coursebuild:coursebuild-academy-v1:academy-i4'},
        {id:'academy-i5',moduleId:'academy-m4',type:'Page',title:'Canvas trust states',purpose:'Explain configured, unverified, sent, verified, failed, and recovery states.',points:0,status:'Approved',generation:{state:'Approved',error:'',updatedAt:now()},publish:{state:'Not sent',error:'',verificationError:'',canvasId:'',canvasUrl:'',verifiedAt:'',updatedAt:''},draftHtml:'<h2>Canvas trust states</h2><p>Configuration is not verification. CourseBuild should only present a Canvas connection or published item as verified after successful read-back.</p>',canvasUrl:'',coursebuildKey:'coursebuild:coursebuild-academy-v1:academy-i5'},
        {id:'academy-i6',moduleId:'academy-m4',type:'Assignment',title:'Create an adaptation',purpose:'Create an Online or Hybrid adaptation while preserving the master course.',points:15,status:'Planned',generation:{state:'Not generated',error:'',updatedAt:''},publish:{state:'Not sent',error:'',verificationError:'',canvasId:'',canvasUrl:'',verifiedAt:'',updatedAt:''},draftHtml:'',canvasUrl:'',coursebuildKey:'coursebuild:coursebuild-academy-v1:academy-i6'}
      ],
      master:{revision:0,approvedAt:'',signature:''},
      versions:[
        {id:'master',name:'Master',mode:'Master',syncStatus:'Current'}
      ]
    };
  }

  function academyEnvelope(){
    const state=academyState();
    const stamp=now();
    return {schema:PROJECT_SCHEMA,id:ACADEMY_ID,name:'CourseBuild Academy · Guided Training',createdAt:stamp,updatedAt:stamp,courseState:state,telemetry:null,externalPilot:null,academy:{version:ACADEMY_VERSION,isDemo:true}};
  }

  function installAcademy(reset=false){
    const existing=readJson(projectKey(ACADEMY_ID),null);
    if(existing&&!reset){openAcademy();return;}
    const env=academyEnvelope();
    writeJson(projectKey(ACADEMY_ID),env);
    const index=readJson(INDEX_KEY,[]).filter(x=>x.id!==ACADEMY_ID);
    index.unshift({id:ACADEMY_ID,name:env.name,createdAt:env.createdAt,updatedAt:env.updatedAt,courseCode:'CB 101',courseTitle:'CourseBuild Academy'});
    writeJson(INDEX_KEY,index);
    writeJson(LEGACY_COURSE_KEY,env.courseState);
    localStorage.setItem(ACTIVE_KEY,ACADEMY_ID);
    location.reload();
  }

  function openAcademy(){
    const env=readJson(projectKey(ACADEMY_ID),null);
    if(!env){installAcademy(false);return;}
    writeJson(LEGACY_COURSE_KEY,env.courseState);
    localStorage.setItem(ACTIVE_KEY,ACADEMY_ID);
    location.reload();
  }

  function resetAcademy(){
    if(!confirm('Reset CourseBuild Academy? Your Academy practice changes will be replaced with the original training course. Other courses will not be changed.'))return;
    installAcademy(true);
  }

  function isAcademy(){return localStorage.getItem(ACTIVE_KEY)===ACADEMY_ID;}

  function taskState(){
    if(!isAcademy()||typeof data==='undefined')return null;
    const p=data.profile||{};
    const setupDone=Boolean(String(p.audience||'').trim());
    const blueprintDone=data.architecture?.status==='Approved';
    const reviewItem=(data.items||[]).find(i=>i.id==='academy-i3');
    const reviewDone=reviewItem?.status==='Approved'||reviewItem?.generation?.state==='Approved';
    const healthDone=(data.items||[]).some(i=>i.id==='academy-i4'&&['Approved','Needs Review'].includes(i.status));
    const canvasState=(typeof settings!=='undefined'&&window.CourseBuildTrustModel)?window.CourseBuildTrustModel.normalizedCanvasVerification(settings).state:'Not configured';
    const canvasDone=canvasState==='Connected and verified';
    const adaptDone=(data.versions||[]).length>1;
    const tasks=[
      {key:'setup',label:'Complete course setup',detail:'Add an audience in Course setup and save.',view:'profile',done:setupDone},
      {key:'blueprint',label:'Approve the Blueprint',detail:'Inspect the structure, make one change, then approve it.',view:'plan',done:blueprintDone},
      {key:'review',label:'Improve and approve a draft',detail:'Open “Improve an AI-assisted draft,” revise it, and approve it.',view:'review',done:reviewDone},
      {key:'health',label:'Use Course Health',detail:'Find an incomplete area and resolve at least one issue.',view:'health',done:healthDone},
      {key:'canvas',label:'Verify a Canvas sandbox',detail:'Optional for local training. Use only a sandbox/development Canvas course.',view:'settings',done:canvasDone,optional:true},
      {key:'adapt',label:'Create an adaptation',detail:'Create an Online or Hybrid version without changing the master.',view:'versions',done:adaptDone}
    ];
    const required=tasks.filter(t=>!t.optional);
    const complete=required.filter(t=>t.done).length;
    return {tasks,complete,total:required.length,percent:Math.round((complete/required.length)*100),canvasState};
  }

  function jump(view){q(`.steps button[data-view="${view}"]`)?.click();window.scrollTo({top:0,behavior:'smooth'});}

  function renderLanding(){
    const host=q('#projects');
    if(!host||q('.academy-entry',host))return;
    const anchor=q('.section-head',host)||host.firstElementChild;
    if(!anchor)return;
    const exists=Boolean(readJson(projectKey(ACADEMY_ID),null));
    const section=document.createElement('section');
    section.className='academy-entry';
    section.innerHTML=`<div class="academy-entry-copy"><span class="academy-kicker">COURSEBUILD ACADEMY</span><h3>Learn CourseBuild by using CourseBuild.</h3><p>Practice Setup, Blueprint, Review, Course Health, Canvas trust states, and Adapt in a resettable training course. No live course required.</p><div class="academy-actions"><button class="primary" data-academy-start>${exists?'Continue Academy':'Start guided training'}</button>${exists?'<button data-academy-reset>Reset Academy</button>':''}</div></div><div class="academy-entry-path" aria-label="Academy learning path"><span>Setup</span><i>→</i><span>Blueprint</span><i>→</i><span>Review</span><i>→</i><span>Canvas</span></div>`;
    anchor.insertAdjacentElement('afterend',section);
    q('[data-academy-start]',section).onclick=()=>exists?openAcademy():installAcademy(false);
    q('[data-academy-reset]',section)?.addEventListener('click',resetAcademy);
  }

  function renderCoach(){
    q('.academy-coach')?.remove();
    if(!isAcademy())return;
    const current=q('.view:not(.hidden)');
    if(!current)return;
    const s=taskState();
    if(!s)return;
    const next=s.tasks.find(t=>!t.done&&!t.optional)||s.tasks.find(t=>!t.done);
    const panel=document.createElement('section');
    panel.className='academy-coach';
    panel.innerHTML=`<div class="academy-coach-head"><div><span class="academy-kicker">GUIDED TRAINING · DEMO</span><h3>CourseBuild Academy</h3><p>${s.complete} of ${s.total} core exercises complete</p></div><div class="academy-score"><strong>${s.percent}%</strong><span>training complete</span></div></div><div class="academy-progress"><i><b style="width:${s.percent}%"></b></i></div><div class="academy-task-list">${s.tasks.map(t=>`<button class="academy-task ${t.done?'done':''}" data-academy-view="${esc(t.view)}"><i>${t.done?'✓':t.optional?'○':'•'}</i><span><strong>${esc(t.label)}${t.optional?' · optional':''}</strong><small>${esc(t.detail)}</small></span></button>`).join('')}</div><div class="academy-coach-actions">${next?`<button class="primary" data-academy-next="${esc(next.view)}">Next exercise →</button>`:'<strong>Core training complete. You can keep exploring or reset the Academy.</strong>'}<button data-academy-reset>Reset Academy</button></div><p class="academy-safety">Training boundary: do not publish Academy content to a live student course. Canvas practice should use a sandbox or development course.</p>`;
    current.insertAdjacentElement('afterbegin',panel);
    panel.querySelectorAll('[data-academy-view]').forEach(b=>b.onclick=()=>jump(b.dataset.academyView));
    q('[data-academy-next]',panel)?.addEventListener('click',e=>jump(e.currentTarget.dataset.academyNext));
    q('[data-academy-reset]',panel)?.addEventListener('click',resetAcademy);
  }

  function render(){renderLanding();renderCoach();}
  let timer;
  function schedule(delay=80){clearTimeout(timer);timer=setTimeout(render,delay);}
  window.addEventListener('load',()=>schedule(350));
  document.addEventListener('click',e=>{if(e.target.closest('.steps button,[data-view],#projectSwitcher,[data-rc4-next],[data-rc5-next],[data-rc3-open]'))schedule(120);});
  document.addEventListener('change',()=>schedule(180));
  document.addEventListener('submit',()=>schedule(220));
  window.CourseBuildAcademy={id:ACADEMY_ID,install:installAcademy,open:openAcademy,reset:resetAcademy,isActive:isAcademy,progress:taskState};
})();