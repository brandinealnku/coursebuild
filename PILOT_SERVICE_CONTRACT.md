# CourseBuild Pilot Service Contract

This release separates local document ingestion from backend-dependent generation and Canvas operations.

## Local operations — no backend required

- DOCX text extraction
- PDF text extraction for text-based PDFs
- TXT / Markdown / CSV / HTML ingestion
- document field detection
- filling empty Course Setup fields from detected source information
- explicit non-AI basic Blueprint creation from retained source text

A failed document read must leave the prior course, source, and Blueprint unchanged.

## Generation service

`generateCourseArchitecture` remains the AI Blueprint operation. Failure remains `Generation failed`; no hidden fallback may be substituted.

When no generation service is configured, the UI may offer **Create basic Blueprint**. This is explicitly labeled `Basic source analysis (non-AI)` and is not represented as AI generation.

## Canvas command center

The My Courses command center uses the existing verified Canvas connection state. It must not call live inventory until the destination is `Connected and verified`.

### `getCanvasCourseOverview`

Request envelope follows the existing CourseBuild API envelope and configured verified Canvas target.

Expected response:

```json
{
  "ok": true,
  "data": {
    "courseId": "12345",
    "courseName": "Example Course",
    "counts": {
      "Page": 12,
      "Assignment": 5,
      "Discussion": 6,
      "File": 9,
      "Quiz": 4
    },
    "unpublished": 3
  }
}
```

The backend must derive these values from a fresh Canvas read. The frontend must not synthesize Canvas counts when the read fails. On failure the UI keeps the last explicitly timestamped successful snapshot, if any, and visibly reports that live inventory could not be refreshed.

## Trust requirements

- Configured Canvas credentials are not a verified connection.
- Local CourseBuild counts and live Canvas counts are labeled separately.
- Missing live Canvas inventory displays `—`, not `0`.
- No Canvas success state may be inferred from request completion alone.
- Secrets remain server-side; this public repository must not contain Canvas access tokens or AI provider secrets.
