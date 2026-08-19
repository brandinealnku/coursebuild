/* CourseBuild RC6.4 — pure trust-state model (browser + Node) */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CourseBuildTrustModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const GENERATION=['Not generated','Generating','Needs review','Approved','Generation failed'];
  const PUBLISH=['Not sent','Publishing','Sent / unverified','Verified','Failed'];
  const CANVAS=['Not configured','Configured, unverified','Connected and verified','Connection failed'];

  function legacyGeneration(status){
    const s=String(status||'').toLowerCase();
    if(s==='approved'||s==='sent'||s==='verified')return'Approved';
    if(s.includes('needs review'))return'Needs review';
    if(s.includes('generation failed'))return'Generation failed';
    if(s==='generating')return'Generating';
    return'Not generated';
  }
  function legacyPublish(status){
    const s=String(status||'').toLowerCase();
    if(s==='verified')return'Verified';
    if(s==='sent')return'Sent / unverified';
    return'Not sent';
  }
  function normalizeItem(item){
    item.generation ||= {state:legacyGeneration(item.status),error:'',updatedAt:''};
    if(!GENERATION.includes(item.generation.state))item.generation.state=legacyGeneration(item.status);
    item.generation.error ||= '';
    item.generation.updatedAt ||= '';
    item.publish ||= {state:legacyPublish(item.status),error:'',verificationError:'',canvasId:item.canvasId||'',canvasUrl:item.canvasUrl||'',verifiedAt:'',updatedAt:''};
    if(!PUBLISH.includes(item.publish.state))item.publish.state=legacyPublish(item.status);
    item.publish.error ||= '';
    item.publish.verificationError ||= '';
    item.publish.canvasId ||= item.canvasId||'';
    item.publish.canvasUrl ||= item.canvasUrl||'';
    item.publish.verifiedAt ||= '';
    item.publish.updatedAt ||= '';
    return item;
  }
  function canvasConfigPresent(settings){return Boolean(settings?.appsScriptUrl&&settings?.canvasBaseUrl&&settings?.canvasCourseId);}
  function normalizedCanvasVerification(settings){
    const configured=canvasConfigPresent(settings);
    const current=settings?.canvasVerification||{};
    if(!configured)return{state:'Not configured',courseId:'',courseName:'',courseUrl:'',verifiedAt:'',error:''};
    const sameTarget=String(current.courseId||'')===String(settings.canvasCourseId||'');
    if(current.state==='Connected and verified'&&sameTarget&&current.verifiedAt)return{...current,state:'Connected and verified'};
    if(current.state==='Connection failed'&&sameTarget)return{...current,state:'Connection failed'};
    return{state:'Configured, unverified',courseId:String(settings.canvasCourseId||''),courseName:'',courseUrl:'',verifiedAt:'',error:''};
  }
  function isCanvasVerified(settings){return normalizedCanvasVerification(settings).state==='Connected and verified';}
  function publishedReadbackMatches(item,out){
    if(!out||out.matches!==true)return false;
    const expectedId=String(item?.publish?.canvasId||item?.canvasId||'');
    const actualId=String(out.canvasId||out.id||'');
    if(expectedId&&actualId&&expectedId!==actualId)return false;
    if(out.coursebuildKey&&item?.coursebuildKey&&String(out.coursebuildKey)!==String(item.coursebuildKey))return false;
    if(out.type&&item?.type&&String(out.type).toLowerCase()!==String(item.type).toLowerCase())return false;
    return true;
  }
  function generationApproved(item){return normalizeItem(item).generation.state==='Approved';}
  function publishVerified(item){return normalizeItem(item).publish.state==='Verified';}
  return{GENERATION,PUBLISH,CANVAS,legacyGeneration,legacyPublish,normalizeItem,canvasConfigPresent,normalizedCanvasVerification,isCanvasVerified,publishedReadbackMatches,generationApproved,publishVerified};
});
