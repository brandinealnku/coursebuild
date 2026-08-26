/* CourseBuild Source Material Intelligence — explicit, source-grounded extraction with provenance. */
(function(){
  const q=(s,r=document)=>r.querySelector(s);
  const safe=v=>esc(v??'');
  const now=()=>new Date().toISOString();
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const datePattern='(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+\\d{1,2}(?:,\\s*\\d{4})?|\\b\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?';
  function sourceModel(text){
    const raw=String(text||''),lines=raw.split(/\r?\n/).map(clean).filter(Boolean);
    const modules=[];const assessments=[];const urls=[];const seenUrl=new Set();
    lines.forEach((line,index)=>{
      const module=line.match(/^(?:week|module|unit)\s*(\d{1,2})\s*[:.\-–—]?\s*(.+)?$/i);
      if(module)modules.push({order:Number(module[1]),title:clean(module[2]||line),sourceLine:index+1,evidence:line});
      if(/\b(assignment|quiz|exam|midterm|final|discussion|project|paper|presentation|reflection|lab)\b/i.test(line)&&line.length<260){
        const points=line.match(/\b(\d+(?:\.\d+)?)\s*(?:points?|pts?)\b/i);const date=line.match(new RegExp(datePattern,'i'));
        assessments.push({title:line.replace(/\s*[–—|-]\s*\d+(?:\.\d+)?\s*(?:points?|pts?).*$/i,'').trim(),points:points?Number(points[1]):null,dueDate:date?date[0]:'',sourceLine:index+1,evidence:line});
      }
      for(const m of line.matchAll(/https?:\/\/[^\s)\]}>"']+/gi)){const url=m[0].replace(/[.,;:]$/,'');if(!seenUrl.has(url)){seenUrl.add(url);urls.push({url,sourceLine:index+1,evidence:line});}}
    });
    const totalPoints=assessments.filter(a=>Number.isFinite(a.points)).reduce((n,a)=>n+a.points,0);
    const meeting=lines.find(l=>/\b(?:monday|tuesday|wednesday|thursday|friday|mon\.?|tue(?:s)?\.?|wed\.?|thu(?:rs)?\.?|fri\.?)\b/i.test(l)&&/\b\d{1,2}:\d{2}\b/.test(l))||'';
    const termLine=lines.find(l=>/\b(course dates?|term dates?|semester dates?|begins?|ends?)\b/i.test(l)&&new RegExp(datePattern,'i').test(l))||'';
    return{analyzedAt:now(),sourceCharacters:raw.length,modules:modules.slice(0,24),assessments:assessments.slice(0,60),resources:urls.slice(0,200),totalExplicitPoints:totalPoints||null,meetingPattern:meeting,termDateEvidence:termLine,provenancePolicy:'Every extracted value includes source evidence; extraction is a proposal for instructor review.'};
  }
  function analyzeCurrent(){const text=String(data.source?.text||data.source?.digest||'').trim();if(!text)return null;data.source ||= {};data.source.courseModel=sourceModel(text);save();return data.source.courseModel;}
  function renderEvidence(){
    const host=q('#profile'),model=data.source?.courseModel;if(!host||!model)return;q('[data-source-model]',host)?.remove();
    const box=document.createElement('section');box.className='panel';box.dataset.sourceModel='true';
    box.innerHTML=`<p class="eyebrow">Source model</p><h3>What CourseBuild can substantiate from your documents</h3><p>These are detected facts and structures, not accepted course decisions. Review the original source before relying on them.</p><div class="cards mini-cards"><article class="card"><span>Modules / weeks</span><strong>${model.modules.length}</strong></article><article class="card"><span>Assessments</span><strong>${model.assessments.length}</strong></article><article class="card"><span>Resources</span><strong>${model.resources.length}</strong></article><article class="card"><span>Explicit points</span><strong>${model.totalExplicitPoints??'—'}</strong></article></div><details><summary>Review source evidence</summary>${model.meetingPattern?`<p><strong>Meeting pattern:</strong> ${safe(model.meetingPattern)}</p>`:''}${model.termDateEvidence?`<p><strong>Term/date evidence:</strong> ${safe(model.termDateEvidence)}</p>`:''}${model.modules.length?`<h4>Detected modules/weeks</h4><ul>${model.modules.slice(0,12).map(m=>`<li>${safe(m.evidence)} <small>line ${m.sourceLine}</small></li>`).join('')}</ul>`:''}${model.assessments.length?`<h4>Detected assessments</h4><ul>${model.assessments.slice(0,12).map(a=>`<li>${safe(a.evidence)} <small>line ${a.sourceLine}</small></li>`).join('')}</ul>`:''}${model.resources.length?`<h4>Detected resources</h4><ul>${model.resources.slice(0,12).map(r=>`<li>${safe(r.url)} <small>line ${r.sourceLine}</small></li>`).join('')}</ul>`:''}</details>`;
    const first=host.querySelector('.cb-document-intelligence');if(first)first.insertAdjacentElement('afterend',box);else host.prepend(box);
  }
  function install(){
    const baseHandle=window.handleFile;if(typeof baseHandle==='function')window.handleFile=async function(file){const result=await baseHandle(file);if(String(data.source?.text||'').trim()){analyzeCurrent();renderEvidence();}return result;};
    const baseProfile=window.renderProfile;if(typeof baseProfile==='function')window.renderProfile=function(){baseProfile();renderEvidence();};
    const saveSource=q('#saveSource');if(saveSource)saveSource.addEventListener('click',()=>setTimeout(()=>{analyzeCurrent();renderEvidence();},0));
    window.CourseBuildSourceIntelligence={analyze:analyzeCurrent,extract:sourceModel};
    if(String(data.source?.text||data.source?.digest||'').trim()){analyzeCurrent();renderEvidence();}
  }
  window.addEventListener('load',()=>setTimeout(install,180));
})();
