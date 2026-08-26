# Course Ops Cloudflare Worker deployment

Course Ops is deployed as one Cloudflare Worker with server-side API routes plus static application assets.

## Cloudflare build settings

- Repository: `brandinealnku/coursebuild`
- Production branch: `main`
- Root directory: repository root (`/` or blank/default)
- Build command: none or `exit 0`
- Deploy command: `npm run deploy:cloudflare`

Do not use `npx wrangler deploy` as the Cloudflare deploy command for this project. Course Ops requires the Canvas access token to be promoted from the protected Cloudflare build environment into a Worker runtime secret during the same deployment. `npm run deploy:cloudflare` performs that bridge without committing or printing the token.

`wrangler.jsonc` defines `worker.js` as the Worker entrypoint. Static browser assets come only from the committed `apps/` directory through the `ASSETS` binding. The repository root is intentionally **not** used as the asset directory because Wrangler rejects a configuration where the Worker entrypoint is contained inside the static asset tree.

The Worker preserves the public routes:

- `/` redirects to `/apps/course-ops/`
- `/apps/course-ops/*` maps internally to the `course-ops/` asset tree
- `/apps/coursebuild-classic/*` maps internally to the `coursebuild-classic/` asset tree
- `/api/course-ops` routes to the Course Ops server handler
- `/api/coursebuild` routes to the CourseBuild Classic server handler

`apps/.assetsignore` prevents preserved Classic backend and test files from being published as browser assets.

## Required production configuration

### Repository-controlled runtime variable

`wrangler.jsonc` declares:

- `CANVAS_BASE_URL=https://nku.instructure.com`

### Cloudflare build secret

Cloudflare Workers Builds must expose `CANVAS_ACCESS_TOKEN` to the build environment as a protected build variable/secret. The deploy wrapper reads it from `process.env`, writes a temporary `0600` JSON secrets file outside the repository, passes that file to `wrangler deploy --secrets-file`, and deletes the temporary directory in a `finally` block.

The actual Canvas token must never be committed to this repository or written into browser assets.

`wrangler.jsonc` also declares `CANVAS_ACCESS_TOKEN` in `secrets.required`, so a deployment fails closed if the runtime secret is not attached.

Optionally, `COURSE_OPS_ALLOWED_CANVAS_HOSTS` may contain a comma-separated allowlist of additional Canvas hostnames. The server refuses to send the Canvas credential to any host not on the allowlist.

## Deployment smoke test

After production deployment, open:

`https://coursebuild.itsbadlabs.com/api/course-ops`

Expected result is JSON with `canvasConfigured: true` and `nku.instructure.com` in `approvedCanvasHosts`.

Then verify:

1. `https://coursebuild.itsbadlabs.com/` redirects to Course Ops.
2. `https://coursebuild.itsbadlabs.com/apps/course-ops/` serves the Course Ops Inspector.
3. `https://coursebuild.itsbadlabs.com/apps/coursebuild-classic/` still serves CourseBuild Classic.
4. The Course Ops Inspector can verify and inspect an approved Canvas course without exposing the token to the browser.

## Build-trigger note

After changing the Cloudflare Workers Builds deploy command, push a fresh commit to `main` so the new build configuration is exercised. A documentation-only commit is sufficient and does not change application behavior.

## Release boundary

Course Ops remains read-only. This deployment patch only changes how the existing Canvas secret reaches the Worker runtime. It does not add Canvas mutations, bulk editing, or mutation verification. A successful Cloudflare deployment is deployment evidence, not proof that Canvas inspection works end to end; the smoke tests above are still required.
