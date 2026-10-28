# No Kill Switch · Opportunity Foundry

A private operating workspace for discovering opportunities, testing commercial theses and allocating finite attention and capital. Operated by **Vice Versa Reality Pty Ltd trading as No Kill Switch**. Experiments use the same trading identity; no new company is assumed.

The foundation is a Vite/React single-page app, with local browser persistence and optional authenticated Supabase sync. Cloudflare Workers Static Assets is the deployment target. There is no model provider, paid service, deployment or outreach automation enabled.

## Start locally

Use Node 22 LTS and npm. Run `npm ci`, then `npm run dev`. Run `npm run check` for domain tests and a production build. The app starts empty; Workspace → Load generic demo is optional. Import the owner's separately supplied private seed to use the real opportunity register. Export backups regularly.

## Included

- Opportunity register and editable five-dimension scoring; unknown scores remain unknown.
- Evidence register with observations, market tests, opinions, assumptions and counterevidence.
- Nine independent research-role packets and append-only report entry, with model identity, context exposure, sources, assumptions, uncertainty, dissent and falsifiers.
- Human decision history with linked evidence snapshots; no score-driven automatic rejection.
- Experiment hypotheses, metrics, thresholds, deadlines, budgets, approvals and outcomes, including failures.
- Portfolio dashboard and realised cash ledger with explicit GST, company tax, personal tax and extraction reserves.
- Versioned JSON import/export and optional per-owner Supabase sync with optimistic concurrency.
- Isolated `foundry` schema migration, owner RLS and administrator-managed admission.

The dashboard default target/deadline is an editable product configuration. All demo data is generic. Actual finances, named opportunities, credentials and research must stay outside this public repository.

## Read next

- [Architecture and limitations](docs/ARCHITECTURE.md)
- [Deployment and Supabase setup](docs/DEPLOYMENT.md)
- [Discovery and first 14-day cycle](docs/OPERATING_PLAYBOOK.md)
- [Reusable launch checklist](templates/LAUNCH.md)
- [Security and data boundaries](SECURITY.md)

No live commercial validation has been performed merely by installing this software. A usable foundation is not a claim that the wealth target is achievable.
