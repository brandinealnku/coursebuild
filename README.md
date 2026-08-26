# CourseBuild repository · ITSBAD Labs

This repository now hosts two independent course-tooling applications.

## Active development — Course Ops

`apps/course-ops/`

Course Ops is the Canvas course-operations product: a fast control layer for understanding existing shells, editing content, bulk administration, cross-course operations, and verified changes.

The repository root routes directly to Course Ops so `coursebuild.itsbadlabs.com/` opens the active application after deployment.

Signature workflow: **Inspect → Select → Change → Review → Apply → Verify**.

## Preserved product — CourseBuild Classic

`apps/coursebuild-classic/`

The complete pre-transition CourseBuild application is preserved intact from commit `8600f8a58526b8bfe64398e29f3f3957d9762df9`.

A second preserved reference point is available on branch `archive/coursebuild-classic-2026-08`.

## Repository structure

```text
apps/
  coursebuild-classic/   Existing source-grounded course-creation product
  course-ops/            New Canvas course-operations product
packages/                Deliberately shared infrastructure only
docs/                    Product boundaries and decisions
```

## Transition rule

Do not add Course Ops features to CourseBuild Classic files. Do not extract shared code prematurely. Each application owns its own UI and product model; shared infrastructure is extracted only when a tested cross-product need exists.

## Verification

This repository structure does not prove either application is production-ready. Browser/device checks and real Canvas end-to-end verification remain separate release gates.
