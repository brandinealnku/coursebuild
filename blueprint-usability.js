/* CourseBuild Blueprint usability hardening: DOCX import + Canvas item types + real action menus */
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

  function closeMenu(){if(openMenu){openMenu.remove();openMenu=null;}qa('[aria-expanded="true"]').forEach(x=>x.setAttribute('aria-expanded','false'));}
  function place(menu,anchor){document.body.appendChild(menu);menu.hidden=false;const r=anchor.getBoundingClientRect(),m=menu.getBoundingClientRect();let left=Math.min(r.left,window.innerWidth-m.width-12),top=r.bottom+6;if(top+m.height>window.innerHeight-12)top=Math.max(12,r.top-m.height-6);menu.style.left=Math.max(12,left)+'px';menu.style.top=Math.max(12,top)+'px';openMenu=menu;anchor.setAttribute('aria-expanded','true');}
  function menuButton(label,icon,fn,opts={}){const b=document.createElement('button');b.type='button';b.innerHTML=`<span class="cb-icon">${icon}</span><span>${label}</span>`;if(opts.danger)b.classList.add('danger');if(opts.disabled)b.disabled=true;b.addEventListener('click',()=>{closeMenu();if(!b.disabled)fn();});return b;}

  function addTypedItem(moduleId,type){
    const before=new Set((data.items||[]).map(i=>i.id));addItem(moduleId);
    const item=(data.items||[]).find(i=>!before.has(i.id))||(data.items||[]).find(i=>i.id===selectedItemId);if(!item)return;
    item.type=type;item.title=`New ${type}`;item.points=0;item.status='Planned';item.draftHtml='';selectedItemId=item.id;invalidateArchitecture();save();renderPlan();
  }
  function showTypeMenu(anchor,moduleId){closeMenu();const menu=document.createElement('div');menu.className='cb-popover';menu.setAttribute('role','menu');menu.innerHTML='<div class="cb-popover-title">Add Canvas item</div>';TYPES.forEach(t=>menu.appendChild(menuButton(t.label,t.icon,()=>addTypedItem(moduleId,t.id))));place(menu,anchor);}
  function duplicateModule(id){const source=data.modules.find(m=>m.id===id);if(!source)return;const index=data.modules.findIndex(m=>m.id===id),newModuleId=`m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;data.modules.splice(index+1,0,{...source,id:newModuleId,title:`${source.title} copy`,order:index+2,status:'Planned'});const copies=(data.items||[]).filter(i=>i.moduleId===id).map(i=>{const newId=`i-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;return {...i,id:newId,moduleId:newModuleId,draftHtml:'',status:'Planned',coursebuildKey:`coursebuild:${data.profile?.id||'course'}:${newId}`};});data.items.push(...copies);data.modules.forEach((m,i)=>m.order=i+1);invalidateArchitecture();save();renderPlan();}
  function showModuleMenu(anchor,id){closeMenu();const idx=data.modules.findIndex(m=>m.id===id),menu=document.createElement('div');menu.className='cb-popover';menu.setAttribute('role','menu');menu.innerHTML='<div class="cb-popover-title">Module actions</div>';menu.appendChild(menuButton('Add course item','+',()=>showTypeMenu(anchor,id)));menu.appendChild(menuButton('Move up','↑',()=>moveModule(id,'up'),{disabled:idx<=0}));menu.appendChild(menuButton('Move down','↓',()=>moveModule(id,'down'),{disabled:idx<0||idx>=data.modules.length-1}));menu.appendChild(menuButton('Duplicate module','⧉',()=>duplicateModule(id)));menu.appendChild(document.createElement('hr'));menu.appendChild(menuButton('Delete module','×',()=>safeDeleteModule(id),{danger:true}));place(menu,anchor);}

  function ensureTypeOptions(){const sel=q('#rc3ItemType');if(!sel)return;const current=(data.items||[]).find(i=>i.id===selectedItemId)?.type||sel.value;sel.innerHTML=TYPES.map(t=>`<option value="${t.id}">${t.label}</option>`).join('');sel.value=TYPES.some(t=>t.id===current)?current:'Page';const points=sel.closest('.grid')?.querySelector('label:has(#rc3ItemPoints)');if(points)points.classList.toggle('cb-points-hidden',!['Assignment','Quiz'].includes(sel.value));sel.onchange=e=>patchItem(selectedItemId,{type:e.target.value});}

  async function inflateRaw(bytes){if(typeof DecompressionStream==='undefined')throw new Error('This browser cannot read compressed Word files yet. Try a current Chrome, Edge, or Safari version.');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(stream).arrayBuffer());}
  function u16(v,o){return v.getUint16(o,true)} function u32(v,o){return v.getUint32(o,true)}
  async function zipEntry(buffer,wanted){
    const bytes=new Uint8Array(buffer),v=new DataView(buffer);let eocd=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(u32(v,i)===0x06054b50){eocd=i;break;}}if(eocd<0)throw new Error('This Word file does not appear to be a valid DOCX archive.');
    const count=u16(v,eocd+10),offset=u32(v,eocd+16);let p=offset;
    for(let n=0;n<count;n++){if(u32(v,p)!==0x02014b50)break;const method=u16(v,p+10),size=u32(v,p+20),nameLen=u16(v,p+28),extraLen=u16(v,p+30),commentLen=u16(v,p+32),localOffset=u32(v,p+42),name=new TextDecoder().decode(bytes.slice(p+46,p+46+nameLen));if(name===wanted){const localNameLen=u16(v,localOffset+26),localExtraLen=u16(v,localOffset+28),start=localOffset+30+localNameLen+localExtraLen,compressed=bytes.slice(start,start+size);if(method===0)return compressed;if(method===8)return inflateRaw(compressed);throw new Error('This DOCX uses an unsupported compression method.');}p+=46+nameLen+extraLen+commentLen;}
    throw new Error('CourseBuild could not find the main document content inside this DOCX file.');
  }
  function xmlToText(xmlBytes){const xml=new TextDecoder('utf-8').decode(xmlBytes),doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('CourseBuild could not parse the Word document text.');const paragraphs=[...doc.getElementsByTagNameNS('*','p')];const lines=paragraphs.map(p=>{let text='';p.querySelectorAll('*').forEach(n=>{const local=n.localName;if(local==='t')text+=n.textContent||'';else if(local==='tab')text+='\t';else if(local==='br'||local==='cr')text+='\n';});return text.trim();}).filter(Boolean);return lines.join('\n');}
  async function importDocx(file){
    const previous=JSON.parse(JSON.stringify(data.source||{}));
    try{const xml=await zipEntry(await file.arrayBuffer(),'word/document.xml'),text=xmlToText(xml).replace(/\n{3,}/g,'\n\n').trim();if(text.length<20)throw new Error('CourseBuild found too little readable text in this Word document.');data.source={...data.source,text,digest:'',fileName:file.name,importedAt:new Date().toISOString(),importMode:'DOCX'};invalidateArchitecture();save();renderPlan();toast(`Word syllabus imported: ${text.length.toLocaleString()} characters retained.`);}catch(e){data.source=previous;save();renderPlan();toast(`We couldn't read this Word document. Your existing Blueprint was not changed. ${e.message||''}`);}
  }
  function installDocxSupport(){
    if(typeof handleFile!=='function')return;const legacyHandle=handleFile;
    handleFile=async function(file){if(!file)return;const name=String(file.name||'').toLowerCase();if(name.endsWith('.docx'))return importDocx(file);if(name.endsWith('.doc')){toast('Legacy .doc files are not supported. Save the document as .docx or PDF and try again.');return;}return legacyHandle(file);};
  }
  function decorateSource(){const input=q('#sourceFile'),box=q('.rc3-source');if(input)input.setAttribute('accept','.docx,.doc,.pdf,.txt,.md,.csv,.html,.htm,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf');if(box&&!q('.cb-source-formats',box)){const p=document.createElement('p');p.className='cb-type-note cb-source-formats';p.textContent='Supported source files: Word (.docx), PDF, TXT, Markdown, CSV, and HTML. Legacy .doc files should be saved as .docx or PDF.';box.appendChild(p);}}
  function decorate(){const host=q('#plan');if(!host)return;qa('[data-rc3-add-item]',host).forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.onclick=e=>{e.preventDefault();showTypeMenu(b,b.dataset.rc3AddItem);};});qa('[data-rc3-module-more]',host).forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.onclick=e=>{e.preventDefault();showModuleMenu(b,b.dataset.rc3ModuleMore);};});ensureTypeOptions();decorateSource();}
  function install(){installDocxSupport();const base=window.renderPlan;if(typeof base!=='function')return;window.renderPlan=function(){base();decorate();};decorate();}

  document.addEventListener('click',e=>{if(openMenu&&!openMenu.contains(e.target)&&!e.target.closest('[data-rc3-add-item],[data-rc3-module-more]'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});window.addEventListener('resize',closeMenu);window.addEventListener('scroll',closeMenu,true);window.addEventListener('load',()=>setTimeout(install,30));
})();
