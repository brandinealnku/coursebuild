# Course Ops

Course Ops is the active product direction for Canvas course operations.

## Primary job

Help instructors understand, edit, bulk-update, and maintain existing Canvas course shells faster than Canvas alone while preserving explicit review and truthful verification.

## Signature workflow

**Inspect → Select → Change → Review → Apply → Verify**

## Initial capability target

1. Connect to a Canvas course safely.
2. Load Modules, Pages, Assignments, Discussions, Quizzes, Files, and Announcements.
3. Provide universal search and a high-density course-content table.
4. Support multi-select and a deliberately constrained first set of bulk operations.
5. Preview every proposed mutation as a change set.
6. Apply changes with per-object progress and partial-failure handling.
7. Read Canvas back before reporting success.

## Product boundary

This transition PR creates the application boundary only. The shell does **not** claim Canvas connectivity, bulk editing, or verification is implemented.
