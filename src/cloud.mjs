import { parseState } from "./domain.mjs";

export function createCloudClient({ url, key, request = fetch }) {
  function configuration() {
    if (!url || !key)
      throw Error("Supabase is not configured. Follow docs/DEPLOYMENT.md.");
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:")
      throw Error("Supabase URL must use HTTPS.");
    let role;
    if (key.startsWith("eyJ")) {
      try {
        role = JSON.parse(
          atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        ).role;
      } catch {
        throw Error("Invalid legacy API key. Use a Supabase publishable key.");
      }
    }
    if (key.startsWith("sb_secret_") || role === "service_role")
      throw Error(
        "Secret and service-role keys must never be used in this browser app. Use a publishable key.",
      );
    return endpoint.href.replace(/\/$/, "");
  }
  function headers(session) {
    return {
      apikey: key,
      Authorization: `Bearer ${session.token}`,
      "Accept-Profile": "foundry",
      "Content-Profile": "foundry",
      "Content-Type": "application/json",
    };
  }
  async function failure(response, fallback) {
    let body;
    try {
      body = await response.json();
    } catch {
      /* Never expose raw responses or tokens. */
    }
    if (body?.code === "PGRST106")
      throw Error(
        "Foundry schema is not exposed in the Supabase Data API. Apply the schema configuration migration.",
      );
    if (response.status === 401)
      throw Error("Supabase session expired or is invalid. Sign in again.");
    if (body?.code === "42501" || response.status === 403)
      throw Error(
        "Foundry access denied. Check owner membership and schema permissions.",
      );
    throw Error(fallback);
  }
  return {
    async signIn(email, password) {
      const r = await request(
        `${configuration()}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: { apikey: key, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      if (!r.ok)
        throw Error(
          "Sign-in failed. Check credentials and project configuration.",
        );
      const session = await r.json();
      if (!session.access_token || !session.user?.id)
        throw Error("Supabase returned an incomplete session.");
      return { token: session.access_token, userId: session.user.id };
    },
    async load(session) {
      const r = await request(
        `${configuration()}/rest/v1/workspaces?owner_id=eq.${encodeURIComponent(session.userId)}&select=state,revision`,
        { headers: headers(session) },
      );
      if (!r.ok)
        await failure(
          r,
          "Cloud read failed. Try again when Supabase is available.",
        );
      const rows = await r.json();
      return rows[0]
        ? { state: parseState(rows[0].state), revision: rows[0].revision }
        : null;
    },
    async save(session, state, revision) {
      parseState(state);
      if (
        revision !== null &&
        (!Number.isSafeInteger(revision) || revision < 1)
      )
        throw Error("Load cloud before saving.");
      const create = revision === null;
      const query = create
        ? ""
        : `?owner_id=eq.${encodeURIComponent(session.userId)}&revision=eq.${revision}`;
      const r = await request(`${configuration()}/rest/v1/workspaces${query}`, {
        method: create ? "POST" : "PATCH",
        headers: { ...headers(session), Prefer: "return=representation" },
        body: JSON.stringify({
          owner_id: session.userId,
          state,
          revision: create ? 1 : revision + 1,
        }),
      });
      if (!r.ok)
        await failure(r, "Cloud save failed. Export a backup before retrying.");
      const rows = await r.json();
      if (rows.length !== 1)
        throw Error(
          "Cloud changed in another session. Export local changes, then load cloud and reconcile.",
        );
      return rows[0].revision;
    },
  };
}
