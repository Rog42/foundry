import { createCloudClient } from "./cloud.mjs";
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
const cloud = createCloudClient({ url: endpoint, key: publicKey });
export const signIn = cloud.signIn;
export const cloudLoad = cloud.load;
export const cloudSave = cloud.save;
