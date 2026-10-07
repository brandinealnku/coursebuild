const $=s=>document.querySelector(s);
const COURSE_OPS_API="/api/course-ops";
const statusEl=$("#status"),courseForm=$("#courseForm"),courseId=$("#courseId"),courseMessage=$("#courseMessage"),assignment=$("#assignment"),result=$("#result");
let connectedCourseId="";

async function courseOps(payload){
  const r=await fetch(COURSE_OPS_API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  const j=await r.json();
  if(!r.ok||j.ok===false) throw new Error(j.error||"Course Ops request failed.");
  return j.data;
}

async function api(payload){
  const r=await fetch("/api/grading-copilot",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  const j=await r.json();
  if(!j.ok) throw new Error(j.error);
  return j.data;
}

(async()=>{
  try{
    const s=await api({action:"status"});
    const identity=await api({action:"verifyIdentity"});
    statusEl.textContent="Canvas token authenticated"+(identity.displayName?" as "+identity.displayName:"")+" · "+s.canvasHost+" · writes "+(s.writesEnabled?"enabled":"disabled");
  }catch(e){
    statusEl.textContent="Canvas authentication needs attention · "+e.message;
  }
})();

courseForm.onsubmit=async e=>{
  e.preventDefault();
  connectedCourseId="";
  assignment.disabled=true;
  assignment.innerHTML='<option value="">Verifying course…</option>';
  courseMessage.textContent="Verifying direct access to this Canvas course…";
  result.textContent="Choose an assignment to load its Canvas submissions.";
  try{
    const course=await courseOps({action:"verifyCourse",canvasBaseUrl:"https://nku.instructure.com",canvasCourseId:courseId.value.trim()});
    connectedCourseId=course.courseId;
    courseMessage.textContent="Connected: "+(course.courseName||course.courseCode||"Canvas course")+" · Course ID "+course.courseId;
    const assignments=await api({action:"listAssignments",courseId:connectedCourseId});
    assignment.innerHTML='<option value="">Select an assignment…</option>'+assignments.map(x=>'<option value="'+x.id+'">'+x.name+' · '+(x.points_possible??"—")+' pts</option>').join("");
    assignment.disabled=false;
    result.textContent=assignments.length+" assignments loaded from Canvas.";
  }catch(e){
    assignment.innerHTML='<option value="">Course connection failed</option>';
    courseMessage.textContent="Course connection needs attention · "+e.message;
  }
};

assignment.onchange=async()=>{
  if(!assignment.value||!connectedCourseId) return;
  result.textContent="Loading submissions…";
  try{
    const s=await api({action:"listSubmissions",courseId:connectedCourseId,assignmentId:assignment.value});
    const submitted=s.filter(x=>x.submitted_at).length;
    result.textContent="Canvas returned "+s.length+" enrollment records; "+submitted+" have a submitted-at timestamp. No grades have been written.";
  }catch(e){
    result.textContent="Submission load needs attention · "+e.message;
  }
};