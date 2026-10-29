# Setup and deployment

Nothing in this repository provisions a paid service or deploys automatically. Obtain owner approval before a paid plan, public deployment, customer outreach, or other consequential action. GitHub checks only test/build.

## Supabase: existing project only

The Supabase connection sprint applied the private-workspace and API-hardening migrations to the authorised existing project. Project connection values and the admitted owner identity are stored privately, outside this repository. Use the existing project specified by the owner, not a new project. Never use `db reset` against the shared project. The steps below describe setup for a fresh target; do not rerun CREATE SCHEMA against an already configured instance.

1. Review `supabase/migrations/20261029040937_foundry_private_workspace.sql`. It creates a new `foundry` schema and will fail if that schema already exists, avoiding silent reuse. Apply this specific migration through the project's SQL editor or a reviewed migration pipeline. It does not modify `public` or shared Auth settings.
2. Inspect the target’s actual exposed API schemas. Review `20261029041112_expose_foundry_schema_and_restrict_unsafe_rpc.sql` before applying: it appends `foundry` to a role override, or uses the verified initial `public, graphql_public` list when there is no override. Adjust that fallback for any other target. It reloads the API configuration and schema cache. It also restricts an optional legacy `public.exec_sql(text)` arbitrary-SQL SECURITY DEFINER function to `service_role`, blocking browser/anonymous execution. Review callers that relied on that unsafe public RPC; server callers should use trusted credentials. No other existing tables or functions are changed.
3. Provision or select the owner's existing Supabase Auth user. Add that verified UUID using an administrator SQL session: `insert into foundry.members(user_id) values ('<verified-auth-user-uuid>');`. Never add general signup-triggered admission. Do not put actual user UUIDs or credentials in Git.
4. Copy `.env.example` to `.env.local`, set the existing project's URL and publishable key, then restart the app. These are public client configuration, not passwords; never substitute a secret/service-role key.
5. Run `supabase/tests/access.sql` against a disposable compatible test database after applying the migration. It asserts owner access, cross-owner denial, nonmember denial and anonymous denial, then rolls back fixtures. The fixture script runs automatically against isolated PostgreSQL during `npm test`; it must not be used to create fake users on the live shared project. Also test through the Data API using actual separate member, nonmember and anonymous sessions; verify all CRUD operations and a stale-revision PATCH.
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

## Shared migration history

The two Foundry migration filenames match the versions recorded by the connected project. Other applications have their own migrations in that shared project; they are intentionally not copied into this public app repository. Apply reviewed Foundry migrations explicitly. Do not run a blind database push, reset or migration-history repair against the shared project.
