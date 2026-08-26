# Course Ops Cloudflare Worker deployment

Course Ops is deployed as one Cloudflare Worker with static assets plus server-side API routes.

## Cloudflare build settings

- Repository: `brandinealnku/coursebuild`
- Production branch: `main`
- Root directory: repository root (`/` or blank/default)
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`

`wrangler.jsonc` defines `worker.js` as the Worker entrypoint, serves repository static assets through the `ASSETS` binding, and invokes the Worker first for `/api/*`.

## Required production bindings

Add these in the Cloudflare Worker settings after the Worker code has been deployed:

- `CANVAS_ACCESS_TOKEN` — encrypted secret containing the Canvas API token.
- `CANVAS_BASE_URL` — normal variable containing the approved Canvas origin, for example `https://institution.instructure.com`.

Optionally, `COURSE_OPS_ALLOWED_CANVAS_HOSTS` may contain a comma-separated allowlist of additional Canvas hostnames. The server refuses to send the Canvas credential to any host not on the allowlist.

Never commit the Canvas token to this repository.

## Deployment smoke test

After production deployment, open:

`https://coursebuild.itsbadlabs.com/api/course-ops`

Expected result is JSON. Before the Canvas secret is configured, the endpoint may report `canvasConfigured: false`; after configuration and redeployment, it should report `canvasConfigured: true` and the approved Canvas hostname.

Then open `https://coursebuild.itsbadlabs.com/` and use the Course Ops Canvas Inspector with the Canvas base URL and course ID.

## Architecture

- `/api/course-ops` → `worker.js` → Course Ops read-only API handlers.
- `/api/coursebuild` → `worker.js` → preserved CourseBuild Classic API handlers.
- All other requests → `env.ASSETS.fetch(request)`.

The Worker patch changes deployment architecture only. Course Ops remains read-only; it does not add Canvas mutations, bulk editing, or mutation verification.
