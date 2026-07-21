// Ambil konfigurasi Firebase Web SDK memakai service account (Admin) lalu tulis
// ke .env.local. Jika belum ada Web App terdaftar, buat satu otomatis.
//
//   node scripts/get-web-config.mjs
//
// Membutuhkan GOOGLE_APPLICATION_CREDENTIALS atau .secrets/serviceAccountKey.json.

import { writeFileSync } from "node:fs";
import { projectId, apiFetch } from "./_token.mjs";

const base = "https://firebase.googleapis.com/v1beta1";

async function main() {
  console.log(`→ Project: ${projectId}`);

  // 1. Cari Web App yang sudah ada.
  const data = await apiFetch(`${base}/projects/${projectId}/webApps`);
  let app = (data.apps || [])[0];

  // 2. Buat bila belum ada.
  if (!app) {
    console.log("→ Belum ada Web App, membuat 'SIJADWAL Web'…");
    const op = await apiFetch(`${base}/projects/${projectId}/webApps`, {
      method: "POST",
      body: JSON.stringify({ displayName: "SIJADWAL Web" }),
    });
    let done = op;
    while (!done.done) {
      await new Promise((r) => setTimeout(r, 1500));
      done = await apiFetch(`${base}/${op.name}`);
    }
    app = done.response;
  }
  console.log(`→ Web App: ${app.displayName} (${app.appId})`);

  // 3. Ambil konfigurasi SDK.
  const cfg = await apiFetch(
    `${base}/projects/${projectId}/webApps/${app.appId}/config`
  );

  const env = [
    "# Dihasilkan otomatis oleh scripts/get-web-config.mjs",
    `NEXT_PUBLIC_FIREBASE_API_KEY=${cfg.apiKey}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${cfg.authDomain}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${cfg.projectId}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${cfg.storageBucket || projectId + ".appspot.com"}`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${cfg.messagingSenderId}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${cfg.appId}`,
    "",
  ].join("\n");

  writeFileSync(".env.local", env);
  console.log("✓ .env.local ditulis dengan konfigurasi Web SDK.");
}

main().catch((e) => {
  console.error("\n✗ Gagal:", e.message);
  process.exit(1);
});
