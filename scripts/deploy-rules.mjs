// Deploy firestore.rules ke project via Firebase Rules API (service account).
//
//   node scripts/deploy-rules.mjs
//
// Membutuhkan GOOGLE_APPLICATION_CREDENTIALS atau .secrets/serviceAccountKey.json.

import { readFileSync } from "node:fs";
import { projectId, apiFetch } from "./_token.mjs";

const source = readFileSync("firestore.rules", "utf8");
const base = "https://firebaserules.googleapis.com/v1";

async function main() {
  // 1. Buat ruleset baru.
  const ruleset = await apiFetch(`${base}/projects/${projectId}/rulesets`, {
    method: "POST",
    body: JSON.stringify({
      source: { files: [{ name: "firestore.rules", content: source }] },
    }),
  });
  console.log(`→ Ruleset dibuat: ${ruleset.name}`);

  // 2. Rilis ke cloud.firestore (buat, atau update bila sudah ada).
  const releaseName = `projects/${projectId}/releases/cloud.firestore`;
  try {
    await apiFetch(`${base}/projects/${projectId}/releases`, {
      method: "POST",
      body: JSON.stringify({ name: releaseName, rulesetName: ruleset.name }),
    });
    console.log("→ Release dibuat.");
  } catch (e) {
    if (e.status === 409) {
      await apiFetch(`${base}/${releaseName}`, {
        method: "PATCH",
        body: JSON.stringify({
          release: { name: releaseName, rulesetName: ruleset.name },
        }),
      });
      console.log("→ Release diperbarui.");
    } else {
      throw e;
    }
  }
  console.log("✓ firestore.rules aktif di project.");
}

main().catch((e) => {
  console.error("\n✗ Gagal deploy rules:", e.message);
  process.exit(1);
});
