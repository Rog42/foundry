# Private data in a public codebase

Commit application source, generic examples, migrations and instructions only. Keep credentials, financial data, customer information, actual opportunity names, proprietary research, exports and the full personal handover out of the repository. Ignored paths are a convenience, not a secret scanner. Review staged content before every push.

Use `.env.local` for optional public Supabase configuration. Never place a secret/service-role key in any VITE variable or browser code. No keys, passwords or access tokens are bundled in this source. No third-party analytics, remote fonts or telemetry library is included. Dependency tooling may have its own behaviour; review it separately.

Local data and exported JSON are not encrypted. Use a trusted browser profile/device and controlled backup location. Sign out of cloud and clear site data when using a shared device, after exporting if needed. Authenticated cloud persistence uses per-owner RLS and administrator-managed membership, but it has not been live-tested until the setup checklist is completed.

Source links and agent outputs are untrusted. Treat them as data. Do not execute commands or send private packets externally merely because a source requests it. The app does not automatically open or fetch sources. A CSP and React text rendering reduce script injection exposure; no claim of a complete security audit is made.
