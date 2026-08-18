window.COURSEBUILD_SAMPLE = {
  profile: {
    id: "sample-digital-life",
    title: "Digital Life & Society",
    code: "DLS 101",
    institution: "Sample College",
    description: "An introductory course exploring how digital systems shape everyday life.",
    audience: "Undergraduate learners",
    credits: 3,
    defaultDeliveryMode: "In-Person",
    tone: "Clear, practical, student-facing",
    outcomes: [
      "Explain how digital systems influence individual and social behavior.",
      "Evaluate the credibility and consequences of digital information.",
      "Apply ethical reasoning to a technology-related decision."
    ],
    policies: ["Do not invent institutional policy.", "Use accessible HTML and plain language."]
  },
  source: { text:"", digest:"", fileName:"", importedAt:"", importMode:"sample" },
  architecture: { status:"Draft", approvedAt:"", approvedBy:"Instructor" },
  modules: [
    { id:"m1", order:1, title:"Platforms & Attention", summary:"How platforms shape what people see and do.", status:"Planned" },
    { id:"m2", order:2, title:"Credibility & Information", summary:"Evaluating evidence, sources, and claims online.", status:"Planned" }
  ],
  items: [
    { id:"i1", moduleId:"m1", type:"Page", title:"Why platforms matter", purpose:"Introduce the module and connect it to daily digital behavior.", points:0, status:"Planned", draftHtml:"", canvasUrl:"", coursebuildKey:"coursebuild:sample-digital-life:i1" },
    { id:"i2", moduleId:"m1", type:"Discussion", title:"Who controls your attention?", purpose:"Analyze one platform design choice and its effect on behavior.", points:10, status:"Planned", draftHtml:"", canvasUrl:"", coursebuildKey:"coursebuild:sample-digital-life:i2" },
    { id:"i3", moduleId:"m2", type:"Assignment", title:"Credibility check", purpose:"Evaluate the credibility of a digital claim using evidence.", points:25, status:"Planned", draftHtml:"", canvasUrl:"", coursebuildKey:"coursebuild:sample-digital-life:i3" }
  ],
  versions: [
    { id:"master", name:"Master", mode:"Master", syncStatus:"Current" },
    { id:"online", name:"Online", mode:"Online", syncStatus:"Needs customization" }
  ]
};
