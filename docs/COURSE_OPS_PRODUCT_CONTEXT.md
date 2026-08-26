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

## V0.1 focus

- Canvas connection and course selection
- Course explorer across major Canvas object types
- Universal search/filtering
- Spreadsheet-like content table
- Multi-select
- First safe bulk operations
- Change-set preview
- Per-object execution state
- Read-back verification

## Explicit non-goals for the repository transition

- No new Canvas feature implementation
- No course-generation workflow
- No AI content generator
- No student tutor
- No institutional administration layer
- No fabricated time-savings or release evidence
