const assert=require('assert');
const M=require('../trust-state-model.js');

function item(status='Planned'){return{id:'i1',type:'Page',title:'Test page',coursebuildKey:'coursebuild:c1:i1',status};}

{
  const i=item('Planned');M.normalizeItem(i);
  assert.equal(i.generation.state,'Not generated');
  assert.equal(i.publish.state,'Not sent');
}
{
  const i=item('Needs Review');M.normalizeItem(i);assert.equal(i.generation.state,'Needs review');
}
{
  const i=item('Approved');M.normalizeItem(i);assert.equal(i.generation.state,'Approved');assert.equal(i.publish.state,'Not sent');
}
{
  const i=item('Sent');M.normalizeItem(i);assert.equal(i.generation.state,'Approved');assert.equal(i.publish.state,'Sent / unverified');assert.notEqual(i.publish.state,'Verified');
}
{
  const s={canvasBaseUrl:'https://canvas.example.edu',canvasCourseId:'42'};
  assert.equal(M.canvasConfigPresent(s),true);
  assert.equal(M.normalizedCanvasVerification(s).state,'Configured, unverified');
  assert.equal(M.isCanvasVerified(s),false);
  s.canvasVerification={state:'Connected and verified',courseId:'42',courseName:'Course',verifiedAt:'2026-08-18T00:00:00Z'};
  assert.equal(M.isCanvasVerified(s),true);
  s.canvasCourseId='43';
  assert.equal(M.normalizedCanvasVerification(s).state,'Configured, unverified');
}
{
  const s={canvasBaseUrl:'https://canvas.example.edu'};assert.equal(M.normalizedCanvasVerification(s).state,'Not configured');
}
{
  const i=item('Sent');M.normalizeItem(i);i.publish.canvasId='123';
  assert.equal(M.publishedReadbackMatches(i,{matches:true,canvasId:'123',coursebuildKey:i.coursebuildKey,type:'Page'}),true);
  assert.equal(M.publishedReadbackMatches(i,{matches:false,canvasId:'123'}),false);
  assert.equal(M.publishedReadbackMatches(i,{matches:true,canvasId:'999',coursebuildKey:i.coursebuildKey,type:'Page'}),false);
}

console.log('RC6.4 trust-state model tests passed');
