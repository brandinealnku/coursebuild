import { onRequestGet as courseOpsGet, onRequestPost as courseOpsPost } from './functions/api/course-ops.js';
import { onRequestGet as courseBuildGet, onRequestPost as courseBuildPost } from './functions/api/coursebuild.js';

function methodNotAllowed() {
  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

async function runPagesStyleHandler(request, env, getHandler, postHandler) {
  if (request.method === 'GET') return getHandler({ request, env });
  if (request.method === 'POST') return postHandler({ request, env });
  return methodNotAllowed();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/course-ops') {
      return runPagesStyleHandler(request, env, courseOpsGet, courseOpsPost);
    }

    if (url.pathname === '/api/coursebuild') {
      return runPagesStyleHandler(request, env, courseBuildGet, courseBuildPost);
    }

    return env.ASSETS.fetch(request);
  }
};
