/* CourseBuild Blueprint usability hardening: Canvas item types + real action menus */
(function(){
  const TYPES=[
    {id:'Page',label:'Page',icon:'P'},
    {id:'Assignment',label:'Assignment',icon:'A'},
    {id:'Discussion',label:'Discussion',icon:'D'},
    {id:'File',label:'File',icon:'F'},
    {id:'Quiz',label:'Quiz',icon:'Q'}
  ];
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  let openMenu=null;

  function closeMenu(){
    if(openMenu){openMenu.remove();openMenu=null;}
    qa('[aria-expanded="true"]').forEach(x=>x.setAttribute('aria-expanded','false'));
  }
  function place(menu,anchor){
    document.body.appendChild(menu);menu.hidden=false;
    const r=anchor.getBoundingClientRect(),m=menu.getBoundingClientRect();
    let left=Math.min(r.left,window.innerWidth-m.width-12);
    let top=r.bottom+6;
    if(top+m.height>window.innerHeight-12)top=Math.max(12,r.top-m.height-6);
    menu.style.left=Math.max(12,left)+'px';menu.style.top=Math.max(12,top)+'px';openMenu=menu;anchor.setAttribute('aria-expanded','true');
  }
  function menuButton(label,icon,fn,opts={}){
    const b=document.createElement('button');b.type='button';b.innerHTML=`<span class="cb-icon">${icon}</span><span>${label}</span>`;
    if(opts.danger)b.classList.add('danger');if(opts.disabled)b.disabled=true;
    b.addEventListener('click',()=>{closeMenu();if(!b.disabled)fn();});return b;
  }
  function addTypedItem(moduleId,type){
    const before=new Set((data.items||[]).map(i=>i.id));
    addItem(moduleId);
    const item=(data.items||[]).find(i=>!before.has(i.id)) || (data.items||[]).find(i=>i.id===selectedItemId);
    if(!item)return;
    item.type=type;item.title=`New ${type}`;item.points=['Assignment','Quiz'].includes(type)?0:0;item.status='Planned';item.draftHtml='';
    selectedItemId=item.id;invalidateArchitecture();save();renderPlan();
  }
  function showTypeMenu(anchor,moduleId){
    closeMenu();const menu=document.createElement('div');menu.className='cb-popover';menu.setAttribute('role','menu');menu.innerHTML='<div class="cb-popover-title">Add Canvas item</div>';
    TYPES.forEach(t=>menu.appendChild(menuButton(t.label,t.icon,()=>addTypedItem(moduleId,t.id))));
    place(menu,anchor);
  }
  function duplicateModule(id){
    const source=data.modules.find(m=>m.id===id);if(!source)return;
    const index=data.modules.findIndex(m=>m.id===id);const newModuleId=`m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    const moduleCopy={...source,id:newModuleId,title:`${source.title} copy`,order:index+2,status:'Planned'};
    data.modules.splice(index+1,0,moduleCopy);
    const sourceItems=(data.items||[]).filter(i=>i.moduleId===id);
    const copies=sourceItems.map(i=>{const newId=`i-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;return {...i,id:newId,moduleId:newModuleId,title:i.title,draftHtml:'',status:'Planned',coursebuildKey:`coursebuild:${data.profile?.id||'course'}:${newId}`};});
    data.items.push(...copies);data.modules.forEach((m,i)=>m.order=i+1);invalidateArchitecture();save();renderPlan();
  }
  function showModuleMenu(anchor,id){
    closeMenu();const idx=data.modules.findIndex(m=>m.id===id),menu=document.createElement('div');menu.className='cb-popover';menu.setAttribute('role','menu');menu.innerHTML='<div class="cb-popover-title">Module actions</div>';
    menu.appendChild(menuButton('Add course item','+',()=>showTypeMenu(anchor,id)));
    menu.appendChild(menuButton('Move up','↑',()=>moveModule(id,'up'),{disabled:idx<=0}));
    menu.appendChild(menuButton('Move down','↓',()=>moveModule(id,'down'),{disabled:idx<0||idx>=data.modules.length-1}));
    menu.appendChild(menuButton('Duplicate module','⧉',()=>duplicateModule(id)));
    const hr=document.createElement('hr');menu.appendChild(hr);
    menu.appendChild(menuButton('Delete module','×',()=>safeDeleteModule(id),{danger:true}));place(menu,anchor);
  }
  function ensureTypeOptions(){
    const sel=q('#rc3ItemType');if(!sel)return;
    const current=(data.items||[]).find(i=>i.id===selectedItemId)?.type||sel.value;
    sel.innerHTML=TYPES.map(t=>`<option value="${t.id}">${t.label}</option>`).join('');sel.value=TYPES.some(t=>t.id===current)?current:'Page';
    const points=sel.closest('.grid')?.querySelector('label:has(#rc3ItemPoints)');
    if(points)points.classList.toggle('cb-points-hidden',!['Assignment','Quiz'].includes(sel.value));
    sel.onchange=e=>{patchItem(selectedItemId,{type:e.target.value});};
  }
  function decorate(){
    const host=q('#plan');if(!host)return;
    qa('[data-rc3-add-item]',host).forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.onclick=e=>{e.preventDefault();showTypeMenu(b,b.dataset.rc3AddItem);};});
    qa('[data-rc3-module-more]',host).forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.onclick=e=>{e.preventDefault();showModuleMenu(b,b.dataset.rc3ModuleMore);};});
    ensureTypeOptions();
  }
  function install(){
    const base=window.renderPlan;if(typeof base!=='function')return;
    window.renderPlan=function(){base();decorate();};
    decorate();
  }
  document.addEventListener('click',e=>{if(openMenu&&!openMenu.contains(e.target)&&!e.target.closest('[data-rc3-add-item],[data-rc3-module-more]'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  window.addEventListener('resize',closeMenu);window.addEventListener('scroll',closeMenu,true);
  window.addEventListener('load',()=>setTimeout(install,30));
})();
