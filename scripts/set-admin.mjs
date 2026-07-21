// Tetapkan seorang pengguna sebagai Admin Fakultas: set custom claim admin
// + tulis dokumen users/{uid}. Dipakai untuk bootstrap admin pertama.
//
//   node scripts/set-admin.mjs <email> ["Nama Lengkap"]
//
// Membutuhkan GOOGLE_APPLICATION_CREDENTIALS atau .secrets/serviceAccountKey.json.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
const nama = process.argv[3] || null;
if (!email) {
  console.error("Pemakaian: node scripts/set-admin.mjs <email> [\"Nama\"]");
  process.exit(1);
}

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || ".secrets/serviceAccountKey.json";
const sa = JSON.parse(readFileSync(keyPath, "utf8"));
initializeApp({ credential: cert(sa), projectId: sa.project_id });

const auth = getAuth();
const db = getFirestore();

async function main() {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, {
    admin: true,
    peran: "admin",
    prodiId: null,
  });
  await db
    .collection("users")
    .doc(user.uid)
    .set(
      {
        email,
        nama: nama || user.displayName || email,
        peran: "admin",
        prodiId: null,
        aktif: true,
      },
      { merge: true }
    );
  console.log(`✓ ${email} (${user.uid}) sekarang Admin Fakultas.`);
  console.log("  Catatan: pengguna harus logout & login ulang agar token memuat klaim baru.");
}

main().catch((e) => {
  console.error("✗ Gagal:", e.message);
  process.exit(1);
});
