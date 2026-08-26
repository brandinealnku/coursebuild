# CourseBuild RC6.4 — Secure Backend Contract

The public CourseBuild repository intentionally does not contain the Apps Script backend. RC6.4 frontend behavior depends on the deployed secure backend implementing the operations below. Frontend code must not simulate successful responses when these operations are unavailable.

## `verifyCanvasConnection`

Input already supplied by the common CourseBuild API envelope:
- `canvasBaseUrl`
- `canvasCourseId`
- course context

Required behavior:
1. Authenticate to Canvas using the secure server-side credential.
2. Read the configured Canvas course.
3. Fail if Canvas rejects the request or the course is inaccessible.
4. Return the actual destination identity.

Required successful response data:
```json
{
  "courseId": "12345",
  "courseName": "Introduction to WebAI",
  "courseUrl": "https://..."
}
```

The returned `courseId` must identify the actual course read from Canvas, not echo the request payload.

## `publishItem`

RC6.4 sends:
- `item`
- `module`
- `coursebuildKey`
- `idempotencyKey` (same stable CourseBuild key)
- `existingCanvasId` when CourseBuild already knows the object

Required behavior:
1. Use the stable CourseBuild key and/or existing Canvas ID to find an existing CourseBuild-owned object before creating a new one.
2. Update the existing object when a safe match exists.
3. Create only when no existing matching object exists.
4. Never use a retry as permission to create a second object with the same CourseBuild key.
5. Return the actual Canvas object ID and URL after the write request succeeds.

A successful write response is **not** proof of verification. The frontend records it as `Sent / unverified` until read-back succeeds.

## `verifyPublishedItem`

Input:
- intended item identity and type
- `coursebuildKey`
- `canvasId`
- expected title
- module context

Required behavior:
1. Read the exact Canvas Page, Assignment, or Discussion back from Canvas by ID/type.
2. Confirm it is in the configured destination course.
3. Match the Canvas object to the intended CourseBuild identity. Prefer the stable CourseBuild key; also validate type and other durable identifiers available to the backend.
4. Return `matches: false` or fail if identity cannot be established.

Required successful response data:
```json
{
  "matches": true,
  "canvasId": "98765",
  "coursebuildKey": "coursebuild:course-id:item-id",
  "type": "Page",
  "title": "Module overview"
}
```

RC6.4 will not set `Verified` unless `matches === true` and the returned identity is consistent with the intended object.

## Failure semantics

All backend failures must use the existing CourseBuild API error contract (`ok: false` and an actionable `error`, or a non-success HTTP response). Do not return fallback course content or optimistic verification results.

## Backend QA required before release

The secure Apps Script deployment is outside this public repository. AT-05 and AT-06 cannot be marked passed until the deployed backend is updated and exercised against a real Canvas test course.
