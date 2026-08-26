# Shared packages

This directory is reserved for infrastructure that is intentionally shared between CourseBuild Classic and Course Ops.

Likely future candidates include Canvas API transport, stable object mapping, mutation verification, retry/partial-failure primitives, and shared accessibility-safe UI primitives.

Nothing should be moved here until both applications genuinely need the abstraction and the extraction can be tested independently.
