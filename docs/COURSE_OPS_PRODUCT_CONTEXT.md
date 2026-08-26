# Course Ops Product Context

## Product thesis

Course Ops is a Canvas course-operations layer for instructors and course coordinators. It exists because high-frequency course administration in Canvas is fragmented across screens and often limited to one-object-at-a-time workflows.

## Primary user

An instructor or course coordinator who already has one or more Canvas shells and needs to understand, edit, bulk-update, roll over, clean up, or reconcile them efficiently.

## Primary promise

**The fastest trustworthy way to understand, edit, bulk-update, and maintain Canvas courses.**

## Core workflow

**Inspect → Select → Change → Review → Apply → Verify**

## Product principles

- Start from live Canvas state, not a generated course model.
- Optimize first for administrative work that does not require pedagogical judgment.
- Make dense course information easy to scan and edit.
- Prefer bulk operations over repeated object-by-object navigation.
- Never hide the exact objects affected by a mutation.
- Preview high-impact changes before applying them.
- Treat partial failure as a first-class state.
- Read Canvas back before reporting a change as verified.
- AI may translate instructor intent into a proposed change set; AI does not bypass review or verification.
- Do not become a replacement LMS.

## V0.1 — Canvas Inspector

The first product slice implements **Inspect** only.

Implemented in this slice:

- verify one instructor-supplied Canvas course against the server-side Canvas credential;
- enforce an approved Canvas-host boundary before the service can send the Canvas credential;
- fresh read-only inventory for Modules, Pages, Assignments, Discussions, Quizzes, Files, and Announcements;
- module association where Canvas exposes the item in a module;
- searchable/filterable course table;
- type, publication-state, and module filters;
- direct links back to the Canvas object;
- visible timestamp for the fresh Canvas read;
- browser storage limited to Canvas URL and course ID, never the Canvas token.

Not implemented in this slice:

- multi-select;
- edits or mutations of any kind;
- bulk operations;
- change-set preview;
- apply/rollback;
- mutation verification;
- cross-course operations;
- AI commands.

A successful inspection is evidence only that Course Ops could read that Canvas course at that time. It is not evidence that later mutation capabilities work.

## Planned V0.1 continuation

- Multi-select
- First safe bulk operations
- Change-set preview
- Per-object execution state
- Read-back verification

## Non-goals

- No course-generation workflow
- No AI content generator
- No student tutor
- No institutional administration layer
- No fabricated time-savings or release evidence
