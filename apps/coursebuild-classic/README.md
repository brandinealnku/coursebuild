# CourseBuild

**CourseBuild turns existing course materials into a structured, reviewable course ready for Canvas.**

This repository is the standalone CourseBuild Independent User RC1 product build extracted from the original `inf125-ai-course-studio` prototype. The browser application lives at the repository root so it can deploy directly to Cloudflare Pages.

## Product workflow

1. Start or reopen a course.
2. Define the course setup.
3. Import an existing syllabus or course plan.
4. Review and approve the proposed course blueprint.
5. Generate and approve course content.
6. Preview what is ready for Canvas.
7. Publish through the separately configured CourseBuild backend.
8. Adapt an approved master course for other delivery formats.

## Cloudflare Pages

- Production branch: `main`
- Framework preset: None
- Build command: leave blank
- Build output directory: repository root
- Intended custom domain: `coursebuild.itsbadlabs.com`

## Public-repository security boundary

This repository intentionally contains **no API keys, Canvas access tokens, Gemini keys, Google Apps Script deployment URLs, or production credentials**. Backend services are deployed separately and configured at runtime for pilot use.

Do not commit institutional data, student information, private pilot exports, secrets, or credentials.

No open-source license is granted. All rights are reserved unless explicitly stated otherwise.

## RC1

Independent User RC1 focuses on making CourseBuild understandable to instructors who did not build it. It adds customer-facing language, progressive disclosure for research tools, a five-stage workflow indicator, transparent AI fallback messaging, and explicit pilot Canvas-connection disclosure.

Current pilot limitations include real user authentication, Canvas OAuth, multi-tenant authorization, institutional roles, enterprise retention controls, and production-grade audit logging.
