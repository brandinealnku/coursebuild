# Course Ops · Module Reorder Pilot

## Goal

Validate one deliberately narrow Canvas write before adding any scheduler:

> Move one explicitly selected Canvas module to the bottom of the course module list, then read Canvas back and verify the new order.

## Endpoint

`POST /api/course-ops-module-reorder`

## Required payload

```json
{
  "action": "reorderModule",
  "canvasBaseUrl": "https://nku.instructure.com",
  "canvasCourseId": "<course-id>",
  "moduleId": "<module-id>",
  "position": "bottom",
  "confirmWrite": true
}
```

## Safety behavior

- Requires the Canvas host to be on the existing Course Ops allowlist.
- Uses the existing server-side Canvas access token; no token is accepted from the browser payload.
- Requires an explicit `confirmWrite: true` value.
- Refuses unknown module IDs.
- Refuses invalid positions.
- Reads the full module list before the write.
- If the module is already in the requested position, returns a verified no-op.
- Reads the full module list again after the write.
- Reports success only when the refreshed Canvas order confirms the requested position.
- No schedule is included in this pilot.

## Manual verification sequence

1. Use a safe Canvas course where module movement is acceptable.
2. Record the visible module order in Canvas.
3. Select one module that can safely be moved.
4. Send the request above with the real course ID and module ID.
5. Confirm the response reports `verified: true`.
6. Refresh Canvas Modules and confirm the module is visibly at the bottom.
7. If desired, manually restore the original order after the test.

## Release classification

- Action code: BUILT after branch commit.
- Real Canvas write: NOT TESTED until the endpoint is deployed with a configured Canvas credential and exercised against an explicitly approved course/module.
- Thursday scheduler: NOT BUILT by design.
