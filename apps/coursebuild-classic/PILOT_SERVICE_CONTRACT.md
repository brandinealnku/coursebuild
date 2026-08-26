# CourseBuild Pilot Service Contract

CourseBuild uses one same-origin service boundary at `/api/coursebuild`. Educators do not configure or see an Apps Script URL. AI-provider and Canvas credentials remain server-side.

## Deployment variables

The Cloudflare service may use these server-side variables for the controlled pilot:

- `GEMINI_API_KEY` — enables AI Blueprint/item generation.
- `GEMINI_MODEL` — optional; defaults to the model declared in the service implementation.
- `CANVAS_ACCESS_TOKEN` — enables Canvas verification, inventory, supported publishing, and read-back verification.
- `CANVAS_BASE_URL` and `CANVAS_COURSE_ID` — optional service-side defaults; the UI may supply the destination URL/course ID instead.

No secret belongs in this public repository or browser storage.

## Local operations — no backend required

- DOCX text extraction.
- PDF text extraction for text-based PDFs.
- TXT / Markdown / CSV / HTML ingestion.
- source-field detection.
- source-grounded detection of modules/weeks, assessments, explicit points/dates, resources/URLs, meeting-pattern evidence, and term-date evidence.
- filling empty Course Setup fields from detected source information.
- explicit non-AI basic Blueprint creation from retained source text.

Every extracted structure is a proposal with source evidence. A failed document read must leave the prior course, source, and Blueprint unchanged.

## Service operations

### `serviceHealth`
Returns whether the CourseBuild service is reachable and whether generation/Canvas server-side credentials are configured. This is capability state, not proof that a particular Canvas course is connected.

### `generateCourseArchitecture`
Source-grounded AI Blueprint proposal. Failure remains `Generation failed`; no hidden fallback may be substituted.

When generation is unavailable, the UI may offer **Create basic Blueprint**. This is explicitly labeled `Basic source analysis (non-AI)` and is not represented as successful AI generation.

### `generateItem`
Generates a draft for instructor review from the approved Blueprint context and retained course source. A returned draft is `Needs review`, never automatically approved.

### `verifyCanvasConnection`
Reads the configured Canvas course and must return actual `courseId`, `courseName`, and destination URL. Configuration alone is not a verified connection.

### `getCanvasCourseOverview`
Reads the live Canvas destination and returns counts for Page, Assignment, Discussion, File, and Quiz plus unpublished inventory. The frontend must not synthesize Canvas counts when a read fails. Missing live inventory displays `—`, not `0`.

### `publishItem`
The pilot service implements Page, Assignment, Discussion, and Quiz publishing with stable CourseBuild markers. File publishing is deliberately blocked until CourseBuild has an actual binary file to upload; it must never create a placeholder File and call that success.

### `verifyPublishedItem`
Reads the Canvas object after publish and verifies object identity/title plus the stable CourseBuild marker before the frontend may set state to `Verified`.

## Canonical Course Readiness

Course Readiness reports only checks CourseBuild can currently evaluate. Unsupported dimensions such as full accessibility QA, live link validation, rubric completeness, and schedule validation remain explicitly `Not checked` rather than contributing false positive readiness.

## Trust requirements

- Configured Canvas destination is not a verified connection.
- Generated is not approved.
- Sent is not verified.
- Local CourseBuild counts and live Canvas counts are labeled separately.
- A failed refresh never becomes zero inventory.
- A failed AI call never becomes a hidden non-AI fallback.
- Unsupported Canvas object publishing is visibly blocked.
- Secrets remain server-side.

## Verification status

Presence of this implementation and passing repository checks are implementation evidence only. The release remains unverified until the deployed `/api/coursebuild` service is configured and exercised against a real Canvas sandbox/test course with the acceptance tests defined for the release.
