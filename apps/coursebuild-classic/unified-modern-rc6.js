/* CourseBuild RC6 — unified interaction layer */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const INDEX_KEY='coursebuild.projects.v1';
  const ACTIVE_KEY='coursebuild.projects.active.v1';
  const LEGACY_COURSE_KEY='coursebuild.pilot.v4';
  const PROJECT_SCHEMA='coursebuild-project-v1';
  const projectKey=id=>`coursebuild.project.v1.${id}`;
  const readJson=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch(e){return fallback;}};
  const writeJson=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const newId=()=>`project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const now=()=>new Date().toISOString();

  function markBuild(){
    document.documentElement.dataset.coursebuildBuild='rc6-unified-modern';
    const tag=q('.topbar .tag');
    if(tag){
      if(tag.textContent)tag.textContent='';
      if(tag.getAttribute('aria-hidden')!=='true')tag.setAttribute('aria-hidden','true');
    }
  }

  function createCourseFromName(name){
    const currentId=localStorage.getItem(ACTIVE_KEY)||'';
    const index=readJson(INDEX_KEY,[]);
    const title=String(name||'').trim()||'Untitled Course';
    const id=newId();
    const state=JSON.parse(JSON.stringify(window.COURSEBUILD_SAMPLE||{}));
    state.profile={...(state.profile||{}),id,code:'',title,institution:'',description:'',outcomes:[],policies:[]};
    state.modules=[];state.items=[];
    state.source={text:'',digest:'',fileName:'',importedAt:'',importMode:'new project'};
    state.architecture={status:'Draft',approvedAt:'',approvedBy:'Instructor'};
    state.master={revision:0,approvedAt:'',signature:''};
    state.versions=[];
    const env={schema:PROJECT_SCHEMA,id,name:title,createdAt:now(),updatedAt:now(),courseState:state,telemetry:null,externalPilot:null};
    if(currentId){
      const current=readJson(projectKey(currentId),null);
      if(current&&typeof data!=='undefined'){
        current.courseState=JSON.parse(JSON.stringify(data));
        current.updatedAt=now();
        writeJson(projectKey(currentId),current);
      }
    }
    writeJson(projectKey(id),env);
    const next=[...index.filter(x=>x.id!==id),{id,name:title,createdAt:env.createdAt,updatedAt:env.updatedAt,courseCode:'',courseTitle:title}]
      .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    writeJson(INDEX_KEY,next);
    localStorage.setItem(ACTIVE_KEY,id);
    writeJson(LEGACY_COURSE_KEY,state);
    location.reload();
  }

  function openNewCourseDialog(){
    const modal=q('#modal'),body=q('#modalBody');
    if(!modal||!body)return;
    body.innerHTML=`<form class="rc6-modal" id="rc6NewCourseForm">
      <p class="rc6-modal-kicker">New course</p>
      <h2>What are you building?</h2>
      <p>Give the course a working name. You can add the course code, institution, outcomes, and other details in Course setup.</p>
      <label class="rc6-field"><span>Course name</span><input id="rc6CourseName" name="courseName" autocomplete="off" placeholder="e.g., Introduction to Business Analytics" required maxlength="120"></label>
      <div class="rc6-modal-actions"><button type="button" data-rc6-cancel>Cancel</button><button class="primary" type="submit">Create course</button></div>
    </form>`;
    if(!modal.open)modal.showModal();
    setTimeout(()=>q('#rc6CourseName')?.focus(),30);
    q('[data-rc6-cancel]',body)?.addEventListener('click',()=>modal.close(),{once:true});
    q('#rc6NewCourseForm',body)?.addEventListener('submit',e=>{
      e.preventDefault();
      createCourseFromName(new FormData(e.currentTarget).get('courseName'));
    },{once:true});
  }

  function interceptNewCourse(){
    document.addEventListener('click',e=>{
      const trigger=e.target.closest('#newProjectQuick,#rc3NewCourse,#createProject');
      if(!trigger)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openNewCourseDialog();
    },true);
  }

  function normalizeLanguage(){
    const add=q('#newProjectQuick');
    if(add&&add.textContent!=='+ New course')add.textContent='+ New course';
    const close=q('#closeModal');
    if(close&&close.getAttribute('aria-label')!=='Close dialog')close.setAttribute('aria-label','Close dialog');
  }

  function install(){
    markBuild();
    normalizeLanguage();
    interceptNewCourse();

    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{
        scheduled=false;
        normalizeLanguage();
      });
    });
    observer.observe(document.body,{subtree:true,childList:true});
  }

  window.addEventListener('load',()=>setTimeout(install,220));
})();
