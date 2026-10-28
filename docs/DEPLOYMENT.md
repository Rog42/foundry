# Setup and deployment

Nothing in this repository provisions a paid service or deploys automatically. Obtain owner approval before a paid plan, public deployment, customer outreach, or other consequential action. GitHub checks only test/build.

## Supabase: existing project only

No Supabase connector was available during foundation authoring. The migration is prepared, not applied or verified against the live project. Use **global-ai-landscape**, not a new project. Back up the existing database and inspect grants, Auth policy and existing schemas first. Never use `db reset` against the shared project.

1. Review `supabase/migrations/202610290001_foundry.sql`. It creates a new `foundry` schema and will fail if that schema already exists, avoiding silent reuse. Apply this specific migration through the project's SQL editor or a reviewed migration pipeline. It does not modify `public` or shared Auth settings.
2. Add `foundry` to the Data API exposed schemas, preserving existing entries. Do not copy broad grants to `anon` from generic schema examples. This migration intentionally denies anonymous access and restricts authenticated access using RLS.
3. Provision or select the owner's existing Supabase Auth user. Add that verified UUID using an administrator SQL session: `insert into foundry.members(user_id) values ('<verified-auth-user-uuid>');`. Never add general signup-triggered admission. Do not put actual user UUIDs or credentials in Git.
4. Copy `.env.example` to `.env.local`, set the existing project's URL and publishable key, then restart the app. These are public client configuration, not passwords; never substitute a secret/service-role key.
5. Run `supabase/tests/access.sql` against a disposable compatible test database after applying the migration. It asserts owner access, cross-owner denial, nonmember denial and anonymous denial, then rolls back fixtures. The script has not been run against the live project. Also test through the Data API using actual separate member, nonmember and anonymous sessions; verify all CRUD operations and a stale-revision PATCH.
6. Sign in via Workspace, export a local backup, load cloud, then explicitly save. A missing cloud workspace does not silently replace local data. No automatic upload occurs.

Do not change shared Auth site URL, signup or redirect settings just for this app without reviewing the other project users. The MVP password flow needs no redirect changes. To revoke app access, delete the member row as an administrator; this cascades that user's workspace, so back it up first. Do not use revocation as a routine sign-out mechanism.

## Cloudflare

The app uses [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/). The checked-in config disables workers.dev and preview URLs. No production hostname or account is preselected.

1. Run `npm ci` and `npm run check`. Review the compiled files for private seed data and secrets. Source maps are not generated.
2. Obtain approval for the specific account, hostname, access policy and any charges. Configure Cloudflare Access for the operator hostname and verified owner identity before serving private workflows. Database RLS remains necessary even behind Access.
3. Configure an approved custom domain/route in `wrangler.jsonc` and authenticate Wrangler. Keep API tokens in the local environment or approved secret manager. Public repository code is authorised; a public app deployment requires separate approval.
4. Set `FOUNDRY_DEPLOY_APPROVED=yes` only after approval; run `npm run deploy`. This guard prevents accidental use of the project command, but is not a security boundary against direct Wrangler use.
5. Verify HTTPS, Access denial for an unauthorised browser, all `_headers` security headers, anonymous database denial, owner-only CRUD, refresh and backup recovery. A public shell must never contain private data. Disable direct alternative hostnames and previews that bypass Access.
6. Record the actual deployed version and test results privately. Roll back to the prior verified Cloudflare version if needed; do not roll back or reset the shared DB blindly. Local JSON exports remain the simplest recovery path.

Future scheduled discovery needs a Worker entrypoint, cron configuration, private persistence and an explicit execution budget. None is enabled by the static app config. Do not interpret this deployment template as scheduled agent operation.

Sources: [Supabase custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
