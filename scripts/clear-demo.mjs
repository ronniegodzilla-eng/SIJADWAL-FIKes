// Hapus HANYA data contoh (seed) dari Firestore agar siap diisi data asli.
// Menghapus id spesifik seed — TIDAK menyentuh data hasil impor Anda.
// Prodi, periode, dan users dibiarkan (dipakai/asli).
//
//   node scripts/clear-demo.mjs          # tampilkan apa yang akan dihapus (dry-run)
//   node scripts/clear-demo.mjs --yes    # benar-benar menghapus
//
// Membutuhkan GOOGLE_APPLICATION_CREDENTIALS atau .secrets/serviceAccountKey.json.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const doDelete = process.argv.includes("--yes");
const sa = JSON.parse(
  readFileSync(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || ".secrets/serviceAccountKey.json",
    "utf8"
  )
);
initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

const SEED = {
  jadwal: ["j1","j2","j3","j4","j5","j6","j7","j8","j9","j10","j11","j12","j13","j14","j15","j16","j17","j18"],
  dosen: ["d1","d2","d3","d4","d5","d6","d7","d8"],
  ruangan: ["r1","r2","r3","r4","r5"],
  mataKuliah: ["m1","m2","m3","m4","m5","m6","m7","m8"],
  kelas: ["kls-k3-24a","kls-k3-23a","kls-k3-22a","kls-kl-24a","kls-kl-23a","kls-km-25a"],
};

async function main() {
  console.log(doDelete ? "MODE HAPUS (--yes)" : "MODE DRY-RUN (tanpa --yes tidak menghapus)\n");
  let total = 0;
  for (const [col, ids] of Object.entries(SEED)) {
    let present = 0;
    for (const id of ids) {
      const ref = db.collection(col).doc(id);
      const snap = await ref.get();
      if (!snap.exists) continue;
      present++;
      total++;
      if (doDelete) await ref.delete();
    }
    console.log(`${doDelete ? "dihapus" : "akan dihapus"} ${col}: ${present}`);
  }
  console.log(`\nTotal: ${total} dokumen contoh.`);
  console.log("Prodi, periode, dan users TIDAK disentuh.");
  if (!doDelete) console.log("\nJalankan ulang dengan --yes untuk menghapus.");
}

main().catch((e) => {
  console.error("✗ Gagal:", e.message);
  process.exit(1);
});
