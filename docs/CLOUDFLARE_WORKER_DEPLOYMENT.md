# Course Ops Cloudflare Worker deployment

Course Ops is deployed as one Cloudflare Worker with server-side API routes plus static application assets.

## Cloudflare build settings

- Repository: `brandinealnku/coursebuild`
- Production branch: `main`
- Root directory: repository root (`/` or blank/default)
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`

`wrangler.jsonc` defines `worker.js` as the Worker entrypoint. Static browser assets come only from the committed `apps/` directory through the `ASSETS` binding. The repository root is intentionally **not** used as the asset directory because Wrangler rejects a configuration where the Worker entrypoint is contained inside the static asset tree.

The Worker preserves the public routes:

- `/` redirects to `/apps/course-ops/`
- `/apps/course-ops/*` maps internally to the `course-ops/` asset tree
- `/apps/coursebuild-classic/*` maps internally to the `coursebuild-classic/` asset tree
- `/api/course-ops` routes to the Course Ops server handler
- `/api/coursebuild` routes to the CourseBuild Classic server handler

`apps/.assetsignore` prevents preserved Classic backend and test files from being published as browser assets.

## Required production bindings

Add these in the Cloudflare Worker settings after the Worker code has been deployed:

- `CANVAS_ACCESS_TOKEN` — encrypted secret containing the Canvas API token.
- `CANVAS_BASE_URL` — normal variable containing the approved Canvas origin, for example `https://institution.instructure.com`.

Optionally, `COURSE_OPS_ALLOWED_CANVAS_HOSTS` may contain a comma-separated allowlist of additional Canvas hostnames. The server refuses to send the Canvas credential to any host not on the allowlist.

Never commit the Canvas token to this repository.

## Deployment smoke test

After production deployment, open:

`https://coursebuild.itsbadlabs.com/api/course-ops`

Expected result is JSON. Before the Canvas secret is configured, the endpoint may report `canvasConfigured: false`; after configuration and deployment, it should report `canvasConfigured: true` and the approved Canvas hostname.

Then verify:

1. `https://coursebuild.itsbadlabs.com/` redirects to Course Ops.
2. `https://coursebuild.itsbadlabs.com/apps/course-ops/` serves the Course Ops Inspector.
3. `https://coursebuild.itsbadlabs.com/apps/coursebuild-classic/` still serves CourseBuild Classic.
4. The Course Ops Inspector can verify and inspect an approved Canvas course without exposing the token to the browser.

## GitHub reconnect note

After reconnecting the Cloudflare Git integration, push a fresh commit to `main` to trigger the first build from the new connection. This documentation-only commit is safe to use for that purpose because it does not change Worker or application behavior.

## Release boundary

This deployment patch changes static-asset routing only. Course Ops remains read-only. It does not add Canvas mutations, bulk editing, or mutation verification. A successful Cloudflare build is deployment evidence, not proof that Canvas inspection works end to end; the smoke tests above are still required.
