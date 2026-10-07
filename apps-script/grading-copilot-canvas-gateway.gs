/**
 * ITSBAD Labs Grading Copilot — Google Apps Script Canvas Gateway
 *
 * Script Properties required:
 *   CANVAS_BASE_URL = https://nku.instructure.com
 *   CANVAS_API_TOKEN = <Canvas personal access token>
 *
 * Deploy as a Web App executing as the owner.
 * Read-only by design. Grade writes are intentionally not implemented.
 */

function doGet(e) {
  return respond_({ok:true,data:{service:"Grading Copilot Canvas Gateway",status:"available",readOnly:true}});
}

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    return respond_({ok:true,data:handle_(payload)});
  } catch (err) {
    return respond_({ok:false,error:String(err && err.message || err),code:"GATEWAY_ERROR"});
  }
}

function handle_(p) {
  var action = String(p.action || "status");
  if (action === "status") {
    var c = config_();
    return {service:"Grading Copilot Canvas Gateway",status:"available",canvasHost:host_(c.base),readOnly:true};
  }
  if (action === "verifyIdentity") {
    var me = canvas_("GET","/api/v1/users/self/profile");
    return {authenticated:true,userId:String(me.id || ""),displayName:String(me.name || me.short_name || ""),canvasHost:host_(config_().base)};
  }
  if (action === "verifyCourse") {
    var courseId = required_(p.courseId || p.canvasCourseId,"courseId");
    var course = canvas_("GET","/api/v1/courses/" + enc_(courseId));
    return {courseId:String(course.id || courseId),courseName:String(course.name || course.course_code || ""),courseCode:String(course.course_code || ""),courseUrl:course.html_url || ""};
  }
  if (action === "listAssignments") {
    var cid = required_(p.courseId,"courseId");
    return canvasPaged_("/api/v1/courses/" + enc_(cid) + "/assignments?per_page=100&order_by=due_at");
  }
  if (action === "listSubmissions") {
    var cId = required_(p.courseId,"courseId");
    var aId = required_(p.assignmentId,"assignmentId");
    return canvasPaged_("/api/v1/courses/" + enc_(cId) + "/assignments/" + enc_(aId) + "/submissions?include[]=user&include[]=submission_comments&per_page=100");
  }
  throw new Error("Unsupported gateway action: " + action);
}

function config_() {
  var props = PropertiesService.getScriptProperties();
  var base = String(props.getProperty("CANVAS_BASE_URL") || "https://nku.instructure.com").replace(/\/$/,"");
  var token = String(props.getProperty("CANVAS_API_TOKEN") || "");
  if (!/^https:\/\//i.test(base)) throw new Error("CANVAS_BASE_URL must use HTTPS.");
  if (!token) throw new Error("CANVAS_API_TOKEN is not configured in Script Properties.");
  return {base:base,token:token};
}

function canvas_(method,path) {
  var c = config_();
  var r = UrlFetchApp.fetch(c.base + path,{
    method:method,
    headers:{Authorization:"Bearer " + c.token,Accept:"application/json"},
    muteHttpExceptions:true
  });
  var code = r.getResponseCode();
  var text = r.getContentText();
  var body = text ? JSON.parse(text) : {};
  if (code < 200 || code >= 300) {
    var msg = body && body.errors && body.errors[0] && body.errors[0].message || body && (body.message || body.error) || "Canvas request failed";
    throw new Error("Canvas " + code + " at " + path + ": " + msg);
  }
  return body;
}

function canvasPaged_(path) {
  var c = config_(), out = [], url = c.base + path;
  for (var page=0; url && page<30; page++) {
    var r = UrlFetchApp.fetch(url,{method:"get",headers:{Authorization:"Bearer " + c.token,Accept:"application/json"},muteHttpExceptions:true});
    var code=r.getResponseCode(), text=r.getContentText(), body=text?JSON.parse(text):[];
    if(code<200 || code>=300) throw new Error("Canvas " + code + " while loading a list.");
    if(!Array.isArray(body)) throw new Error("Canvas returned an unexpected list response.");
    out=out.concat(body);
    var headers=r.getAllHeaders(), link=String(headers.Link || headers.link || ""), m=link.match(/<([^>]+)>;\s*rel="next"/);
    url=m?m[1]:"";
  }
  return out;
}

function required_(v,name){v=String(v||"").trim();if(!v)throw new Error(name+" is required.");return v;}
function enc_(v){return encodeURIComponent(String(v));}
function host_(base){return base.replace(/^https?:\/\//,"").split("/")[0];}
function respond_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
