/**
 * Grading Copilot V3 — $0 ChatGPT batch bridge
 * Add to GradingCopilotGateway.gs.
 * READ ONLY. No Canvas grade writes.
 */

function gradingCopilotExportBatch_(payload) {
  const workspace = gradingCopilotAssignmentWorkspace_(payload);
  const submitted = workspace.submissions.filter(s => Boolean(s.submittedAt));

  return {
    schemaVersion: "grading-copilot-batch-v1",
    generatedAt: new Date().toISOString(),
    course: { id: String(payload.courseId || "") },
    assignment: workspace.assignment,
    rubric: workspace.rubric,
    gradingRules: workspace.philosophy,
    instructions: [
      "Evaluate only evidence actually present in each submission.",
      "Use PRESENT, MISSING, or UNABLE TO VERIFY for criterion evidence.",
      "UNABLE TO VERIFY is not a deduction.",
      "Do not double-penalize one weakness.",
      "Round in the student's favor when between scores.",
      "Return 2–3 warm, specific sentences of student feedback.",
      "Use HIGH, MEDIUM, or LOW confidence.",
      "Route to APPROVE when evidence is clear, QUICK CHECK when a fast human check is prudent, and BRANDI REVIEW for genuine ambiguity or inaccessible work."
    ],
    students: submitted.map((s, index) => ({
      recordId: "gc-" + String(index + 1).padStart(3, "0"),
      canvasUserId: s.userId,
      studentName: s.studentName,
      submittedAt: s.submittedAt,
      late: s.late,
      submissionType: s.submissionType,
      body: s.body || "",
      submittedUrl: s.url || "",
      previewUrl: s.previewUrl || "",
      attachments: s.attachments || []
    })),
    requiredResultSchema: {
      schemaVersion: "grading-copilot-results-v1",
      assignmentId: String(workspace.assignment.id),
      results: [{
        recordId: "gc-001",
        scores: {
          aiLiteracy: 0,
          systemMapping: 0,
          humanJudgment: 0,
          perspectives: 0,
          ethics: 0,
          reflection: 0,
          clarity: 0
        },
        total: 0,
        verification: {
          aiLiteracy: "PRESENT",
          systemMapping: "PRESENT",
          humanJudgment: "PRESENT",
          perspectives: "PRESENT",
          ethics: "PRESENT",
          reflection: "PRESENT",
          clarity: "PRESENT"
        },
        evidence: {
          aiLiteracy: "",
          systemMapping: "",
          humanJudgment: "",
          perspectives: "",
          ethics: "",
          reflection: "",
          clarity: ""
        },
        confidence: "HIGH",
        route: "APPROVE",
        feedback: ""
      }]
    }
  };
}

function gradingCopilotValidateResults_(payload) {
  const data = payload && payload.resultsFile ? payload.resultsFile : payload;
  if (!data || data.schemaVersion !== "grading-copilot-results-v1") {
    throw new Error("This is not a Grading Copilot results file.");
  }
  if (!Array.isArray(data.results)) throw new Error("Results array is missing.");

  const max = {aiLiteracy:8,systemMapping:8,humanJudgment:6,perspectives:4,ethics:6,reflection:4,clarity:4};
  const routes = ["APPROVE","QUICK CHECK","BRANDI REVIEW"];
  const confidence = ["HIGH","MEDIUM","LOW"];

  const clean = data.results.map(r => {
    if (!r.recordId) throw new Error("A result is missing recordId.");
    let total = 0;
    const scores = {};
    Object.keys(max).forEach(k => {
      const n = Number(r.scores && r.scores[k]);
      if (!Number.isFinite(n) || n < 0 || n > max[k]) {
        throw new Error(r.recordId + ": invalid score for " + k);
      }
      scores[k] = n;
      total += n;
    });
    if (total > 40) throw new Error(r.recordId + ": total exceeds 40.");
    return {
      recordId: String(r.recordId),
      scores,
      total,
      verification: r.verification || {},
      evidence: r.evidence || {},
      confidence: confidence.includes(r.confidence) ? r.confidence : "LOW",
      route: routes.includes(r.route) ? r.route : "BRANDI REVIEW",
      feedback: String(r.feedback || "")
    };
  });

  return {ok:true, count:clean.length, results:clean};
}

// Add these cases inside gradingCopilotHandle_:
// case 'exportBatch': return gradingCopilotExportBatch_(payload);
// case 'validateResults': return gradingCopilotValidateResults_(payload);
