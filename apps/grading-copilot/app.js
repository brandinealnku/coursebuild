const $=s=>document.querySelector(s),statusEl=$("#status"),course=$("#course"),assignment=$("#assignment"),result=$("#result");

async function api(payload){
  const r=await fetch("/api/grading-copilot",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  const j=await r.json();
  if(!j.ok) throw new Error(j.error);
  return j.data;
}

(async()=>{
  try{
    const s=await api({action:"status"});
    statusEl.textContent=`Connected to ${s.canvasHost} · Canvas writes ${s.writesEnabled?"enabled":"disabled"}`;
    const cs=await api({action:"listCourses"});
    if(!cs.length){
      statusEl.textContent="Canvas connected, but Canvas returned no courses for this token.";
      course.innerHTML='<option value="">No courses returned by Canvas</option>';
      return;
    }
    statusEl.textContent+=` · ${cs.length} courses found`;
    course.innerHTML='<option value="">Select a course…</option>'+cs.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  }catch(e){
    statusEl.textContent="Canvas connection needs attention · "+e.message;
  }
})();

course.onchange=async()=>{
  assignment.disabled=true;
  assignment.innerHTML='<option>Loading…</option>';
  result.textContent="Choose an assignment to load its Canvas submissions.";
  if(!course.value){
    assignment.innerHTML='<option value="">Select an assignment…</option>';
    return;
  }
  try{
    const a=await api({action:"listAssignments",courseId:course.value});
    assignment.innerHTML='<option value="">Select an assignment…</option>'+a.map(x=>`<option value="${x.id}">${x.name} · ${x.points_possible??"—"} pts</option>`).join("");
    assignment.disabled=false;
  }catch(e){
    assignment.innerHTML='<option>Error loading assignments</option>';
    result.textContent=e.message;
  }
};

assignment.onchange=async()=>{
  if(!assignment.value) return;
  result.textContent="Loading submissions…";
  try{
    const s=await api({action:"listSubmissions",courseId:course.value,assignmentId:assignment.value});
    const submitted=s.filter(x=>x.submitted_at).length;
    result.textContent=`Canvas returned ${s.length} enrollment records; ${submitted} have a submitted-at timestamp. Next: match these runtime records to proposed grades and feedback.`;
  }catch(e){
    result.textContent=e.message;
  }
};
