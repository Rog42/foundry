# Supabase connection sprint review

The foundation had prepared SQL but no connected database. This sprint connects the owner-authorised existing project, configures private workspace persistence, and retains per-owner row-level security. Project values, account identities, admission records and the owner seed remain outside Git. No password is requested in chat or reset.

## Validation

- Eleven automated tests exercise cloud requests, imports, cash calculations, PostgreSQL access policies, administrative helper grants and API-schema-list preservation.
- The production build and browser workflow checks pass.
- Live anonymous read/write probes return access denial.
- The repository records a branch, test, validation, red-team review, pull request and merge workflow for subsequent sprints.

The changes add HTTPS and client-key checks, clearer schema/session/permission errors, and an explicit load-before-save requirement. Optimistic revision filtering prevents silent stale overwrites.

The migration includes defensive restriction of an optional legacy administrative SQL helper to the trusted server role. Review existing callers before applying this generic migration to another environment. Detailed environment-specific security review and operational findings belong in the owner's private records.

## Limits

The owner's normal signed-in browser session is needed to verify cloud save/load through Supabase Auth. Local database tests are not represented as a live authenticated browser test. No public application deployment is performed by this sprint.
