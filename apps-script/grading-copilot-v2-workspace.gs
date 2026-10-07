/**
 * Grading Copilot V2 — assignment review helpers.
 * Paste below the existing GradingCopilotGateway.gs code.
 * Read-only: no Canvas writes.
 */
function gradingCopilotAssignmentWorkspace_(payload) {
  const courseId=gradingCopilotRequired_(payload.courseId,'courseId');
  const wanted=String(payload.assignmentName||'Annotated Diagram of an AI System').trim().toLowerCase();
  const assignments=gradingCopilotCanvasPagedRequest_('/api/v1/courses/'+encodeURIComponent(courseId)+'/assignments?per_page=100');
  const assignment=assignments.find(a=>String(a.name||'').trim().toLowerCase()===wanted) ||
    assignments.find(a=>String(a.name||'').toLowerCase().indexOf('annotated diagram')>=0);
  if(!assignment) throw new Error('Annotated Diagram of an AI System was not found in this course.');
  const submissions=gradingCopilotListSubmissions_({courseId:courseId,assignmentId:assignment.id});
  return {
    assignment:{id:String(assignment.id),name:assignment.name,pointsPossible:assignment.points_possible,dueAt:assignment.due_at||null,htmlUrl:assignment.html_url||''},
    rubric:[
      {key:'aiLiteracy',label:'AI literacy',max:8},
      {key:'systemMapping',label:'System mapping',max:8},
      {key:'humanJudgment',label:'Human judgment',max:6},
      {key:'perspectives',label:'Multiple perspectives',max:4},
      {key:'ethics',label:'Ethical reasoning',max:6},
      {key:'reflection',label:'Revision / reflection',max:4},
      {key:'clarity',label:'Clarity / accessibility',max:4}
    ],
    philosophy:[
      'Find evidence that the learning goals were met; do not hunt for deductions.',
      'Default toward full credit when the learning objective is demonstrated in good faith.',
      'Minor omissions, weak wording, imperfect diagrams, and novice explanations belong in feedback more often than deductions.',
      'Deduct meaningfully only for missing major components, fundamental misunderstanding, extremely incomplete work, or failure to engage.',
      'Round in the student’s favor when between scores. Never double-penalize one weakness.',
      'If evidence cannot be verified, route to review rather than deducting.'
    ],
    submissions:submissions.map(s=>({
      userId:String(s.user_id||s.user&&s.user.id||''),
      studentName:String(s.user&&s.user.name||'Student'),
      workflowState:s.workflow_state||'',
      submittedAt:s.submitted_at||null,
      late:Boolean(s.late),
      score:s.score,
      grade:s.grade,
      attempt:s.attempt||null,
      submissionType:s.submission_type||'',
      body:s.body||'',
      url:s.url||'',
      previewUrl:s.preview_url||'',
      attachments:(s.attachments||[]).map(a=>({id:String(a.id||''),filename:a.filename||a.display_name||'Attachment',contentType:a['content-type']||'',url:a.url||'',previewUrl:a.preview_url||''}))
    }))
  };
}

// Add this case inside gradingCopilotHandle_ switch:
// case 'assignmentWorkspace': return gradingCopilotAssignmentWorkspace_(payload);
