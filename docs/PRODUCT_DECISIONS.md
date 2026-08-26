# Product Decisions

## 2026-08-26 — Separate Course Ops from CourseBuild Classic

**Decision:** Reuse the existing `coursebuild` repository as a multi-application workspace while preserving the current CourseBuild product intact.

**Why:** The new primary job is operating existing Canvas shells, not designing courses from source material. The users overlap, but the core workflow, value proposition, interface density, and product cadence are different enough to require separate application boundaries.

**Repository consequence:**

- `apps/coursebuild-classic/` preserves the existing product.
- `apps/course-ops/` is the new active application.
- `packages/` is reserved for deliberately extracted shared infrastructure.
- Shared code must not be created merely because two applications happen to contain similar logic.

**Release consequence:** Repository restructuring is implementation evidence only. It does not verify either application in a browser or against Canvas.
