import { spawnSync } from "node:child_process";
if (process.env.FOUNDRY_DEPLOY_APPROVED !== "yes") {
  console.error(
    "Deployment requires explicit owner approval. Review docs/DEPLOYMENT.md first.",
  );
  process.exit(1);
}
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["wrangler", "deploy"],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status ?? 1);
