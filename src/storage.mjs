import { parseState } from "./domain.mjs";
const KEY = "nks-foundry-v1";
export function loadLocal() {
  const raw = localStorage.getItem(KEY);
  return raw ? parseState(JSON.parse(raw)) : null;
}
export function saveLocal(state) {
  localStorage.setItem(KEY, JSON.stringify(parseState(state)));
}
export function download(name, data) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readFile(file) {
  if (!file || file.size > 4000000)
    throw Error("Choose a workspace JSON file under 4 MB");
  return parseState(JSON.parse(await file.text()));
}
const endpoint = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured = !!(endpoint && publicKey);
export async function signIn(email, password) {
  if (!cloudConfigured)
    throw Error("Supabase is not configured. Follow docs/DEPLOYMENT.md.");
  const r = await fetch(`${endpoint}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok)
    throw Error("Sign-in failed. Check credentials and project configuration.");
  const session = await r.json();
  return { token: session.access_token, userId: session.user.id };
}
export async function cloudLoad(session) {
  const r = await fetch(
    `${endpoint}/rest/v1/workspaces?owner_id=eq.${encodeURIComponent(session.userId)}&select=state,revision`,
    { headers: headers(session) },
  );
  if (!r.ok)
    throw Error(
      "Cloud read denied or unavailable. Check membership and schema configuration.",
    );
  const rows = await r.json();
  return rows[0]
    ? { state: parseState(rows[0].state), revision: rows[0].revision }
    : null;
}
function headers(session) {
  return {
    apikey: publicKey,
    Authorization: `Bearer ${session.token}`,
    "Accept-Profile": "foundry",
    "Content-Profile": "foundry",
    "Content-Type": "application/json",
  };
}
export async function cloudSave(session, state, revision) {
  parseState(state);
  const create = revision === null;
  const query = create
    ? ""
    : `?owner_id=eq.${encodeURIComponent(session.userId)}&revision=eq.${revision}`;
  const r = await fetch(`${endpoint}/rest/v1/workspaces${query}`, {
    method: create ? "POST" : "PATCH",
    headers: { ...headers(session), Prefer: "return=representation" },
    body: JSON.stringify({
      owner_id: session.userId,
      state,
      revision: create ? 1 : revision + 1,
    }),
  });
  if (!r.ok)
    throw Error("Cloud save failed. Sign in again if the session expired.");
  const rows = await r.json();
  if (rows.length !== 1)
    throw Error(
      "Cloud changed in another session. Export local changes, then load cloud and reconcile.",
    );
  return rows[0].revision;
}
