// Seed Firestore project sijadwal-fikes dengan data awal (master + jadwal).
// Idempoten: memakai doc id tetap, jadi dapat dijalankan ulang tanpa duplikat.
//
//   node scripts/seed-firestore.mjs
//
// Membutuhkan GOOGLE_APPLICATION_CREDENTIALS atau .secrets/serviceAccountKey.json.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || ".secrets/serviceAccountKey.json";
const sa = JSON.parse(readFileSync(keyPath, "utf8"));

initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore();

const PERIODE_AKTIF = "p1";
const MENIT_PER_SKS = 50;

const prodi = [
  { id: "k3", kode: "K3", nama: "S1 Keselamatan & Kesehatan Kerja", jenjang: "S1", aktif: true },
  { id: "kesling", kode: "KESLING", nama: "S1 Kesehatan Lingkungan", jenjang: "S1", aktif: true },
  { id: "kesmas", kode: "KESMAS", nama: "S2 Kesehatan Masyarakat", jenjang: "S2", aktif: true },
];
const dosen = [
  { id: "d1", nidn: "0412078901", nama: "Dr. Andi Wijaya, M.K.K.K.", aktif: true },
  { id: "d2", nidn: "0421058802", nama: "Rina Marlina, S.K.M., M.Kes.", aktif: true },
  { id: "d3", nidn: "0409118503", nama: "Dr. Hendra Gunawan, M.Si.", aktif: true },
  { id: "d4", nidn: "0417039004", nama: "Siti Rahmawati, S.K.M., M.Epid.", aktif: true },
  { id: "d5", nidn: "0402128705", nama: "Budi Santoso, S.T., M.K.K.K.", aktif: true },
  { id: "d6", nidn: "0428077606", nama: "Prof. dr. Laila Hasan, M.P.H.", aktif: true },
  { id: "d7", nidn: "0415098907", nama: "Dedi Kurniawan, S.K.M., M.Kes.", aktif: true },
  { id: "d8", nidn: "0406018808", nama: "Fitri Handayani, S.Si., M.Kes.", aktif: true },
];
const ruangan = [
  { id: "r1", kode: "A201", nama: "Ruang A201", gedung: "Gedung A · Lt.2", aktif: true },
  { id: "r2", kode: "A202", nama: "Ruang A202", gedung: "Gedung A · Lt.2", aktif: true },
  { id: "r3", kode: "B203", nama: "Ruang B203", gedung: "Gedung B · Lt.2", aktif: true },
  { id: "r4", kode: "B305", nama: "Ruang B305", gedung: "Gedung B · Lt.3", aktif: true },
  { id: "r5", kode: "LAB-K3", nama: "Lab K3", gedung: "Gedung C · Lt.1", aktif: true },
];
const mataKuliah = [
  { id: "m1", kode: "K3101", nama: "Toksikologi Industri", sks: 3, semesterKe: 4, prodiId: "k3", aktif: true },
  { id: "m2", kode: "K3102", nama: "Higiene Industri", sks: 2, semesterKe: 4, prodiId: "k3", aktif: true },
  { id: "m3", kode: "K3103", nama: "Sistem Manajemen K3", sks: 2, semesterKe: 6, prodiId: "k3", aktif: true },
  { id: "m4", kode: "KL201", nama: "Pencemaran Lingkungan", sks: 3, semesterKe: 4, prodiId: "kesling", aktif: true },
  { id: "m5", kode: "KL202", nama: "Analisis Risiko Kesehatan Lingkungan", sks: 2, semesterKe: 6, prodiId: "kesling", aktif: true },
  { id: "m6", kode: "KM301", nama: "Epidemiologi Lanjut", sks: 3, semesterKe: 2, prodiId: "kesmas", aktif: true },
  { id: "m7", kode: "KM302", nama: "Biostatistik", sks: 3, semesterKe: 2, prodiId: "kesmas", aktif: true },
  { id: "m8", kode: "KM303", nama: "Surveilans Kesehatan", sks: 2, semesterKe: 2, prodiId: "kesmas", aktif: true },
];
const kelas = [
  { id: "kls-k3-24a", namaRombel: "K3-2024-A", prodiId: "k3", angkatan: 2024, semesterKe: 4, aktif: true },
  { id: "kls-k3-23a", namaRombel: "K3-2023-A", prodiId: "k3", angkatan: 2023, semesterKe: 6, aktif: true },
  { id: "kls-k3-22a", namaRombel: "K3-2022-A", prodiId: "k3", angkatan: 2022, semesterKe: 8, aktif: true },
  { id: "kls-kl-24a", namaRombel: "KESLING-2024-A", prodiId: "kesling", angkatan: 2024, semesterKe: 4, aktif: true },
  { id: "kls-kl-23a", namaRombel: "KESLING-2023-A", prodiId: "kesling", angkatan: 2023, semesterKe: 6, aktif: true },
  { id: "kls-km-25a", namaRombel: "KESMAS-2025-A", prodiId: "kesmas", angkatan: 2025, semesterKe: 2, aktif: true },
];
const periode = [
  { id: "p1", nama: "Ganjil 2026/2027", aktif: true, tanggalMulai: "2026-09-01", tanggalSelesai: "2027-01-31" },
  { id: "p0", nama: "Genap 2025/2026", aktif: false, tanggalMulai: "2026-02-01", tanggalSelesai: "2026-06-30" },
  { id: "p2", nama: "Genap 2026/2027", aktif: false, tanggalMulai: "2027-02-01", tanggalSelesai: "2027-06-30" },
];

// namaRombel → id kelas untuk relasi jadwal.
const rawJadwal = [
  { id: "j1", mataKuliahId: "m6", kelasId: "kls-km-25a", dosenIds: ["d3"], mode: "offline", ruanganId: "r3", hari: 1, jamMulai: 480 },
  { id: "j2", mataKuliahId: "m1", kelasId: "kls-k3-24a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 1, jamMulai: 480 },
  { id: "j3", mataKuliahId: "m7", kelasId: "kls-km-25a", dosenIds: ["d4"], mode: "offline", ruanganId: "r3", hari: 1, jamMulai: 640 },
  { id: "j4", mataKuliahId: "m2", kelasId: "kls-k3-24a", dosenIds: ["d5"], mode: "offline", ruanganId: "r5", hari: 1, jamMulai: 640 },
  { id: "j5", mataKuliahId: "m4", kelasId: "kls-kl-24a", dosenIds: ["d6"], mode: "offline", ruanganId: "r2", hari: 2, jamMulai: 480 },
  { id: "j6", mataKuliahId: "m2", kelasId: "kls-k3-23a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 2, jamMulai: 480 },
  { id: "j7", mataKuliahId: "m5", kelasId: "kls-kl-23a", dosenIds: ["d3"], mode: "online", ruanganId: null, hari: 2, jamMulai: 640 },
  { id: "j8", mataKuliahId: "m8", kelasId: "kls-km-25a", dosenIds: ["d3", "d4"], mode: "offline", ruanganId: "r4", hari: 3, jamMulai: 480 },
  { id: "j9", mataKuliahId: "m3", kelasId: "kls-k3-23a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 2, jamMulai: 640 },
  { id: "j10", mataKuliahId: "m4", kelasId: "kls-kl-23a", dosenIds: ["d6"], mode: "offline", ruanganId: "r2", hari: 3, jamMulai: 480 },
  { id: "j11", mataKuliahId: "m1", kelasId: "kls-k3-23a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 3, jamMulai: 480 },
  { id: "j12", mataKuliahId: "m5", kelasId: "kls-kl-24a", dosenIds: ["d3"], mode: "online", ruanganId: null, hari: 4, jamMulai: 660 },
  { id: "j13", mataKuliahId: "m3", kelasId: "kls-k3-24a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 3, jamMulai: 660 },
  { id: "j14", mataKuliahId: "m2", kelasId: "kls-k3-22a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 4, jamMulai: 480 },
  { id: "j15", mataKuliahId: "m5", kelasId: "kls-kl-24a", dosenIds: ["d6"], mode: "offline", ruanganId: "r2", hari: 5, jamMulai: 480 },
  { id: "j16", mataKuliahId: "m1", kelasId: "kls-k3-22a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 5, jamMulai: 480 },
  { id: "j17", mataKuliahId: "m8", kelasId: "kls-km-25a", dosenIds: ["d4"], mode: "offline", ruanganId: "r4", hari: 6, jamMulai: 480 },
  { id: "j18", mataKuliahId: "m2", kelasId: "kls-k3-23a", dosenIds: ["d5"], mode: "offline", ruanganId: "r5", hari: 6, jamMulai: 480 },
];

const mkById = (id) => mataKuliah.find((m) => m.id === id);

// Perkaya jadwal seperti di app: jamSelesai, sksEfektifPerDosen, prodiId, periodeId.
const jadwal = rawJadwal.map((j) => {
  const mk = mkById(j.mataKuliahId);
  return {
    ...j,
    periodeId: PERIODE_AKTIF,
    jamSelesai: j.jamMulai + mk.sks * MENIT_PER_SKS,
    sksEfektifPerDosen: mk.sks / j.dosenIds.length,
    prodiId: mk.prodiId,
    overrideWarnings: [],
    dibuatOleh: "seed",
    dibuatPada: Date.now(),
  };
});

async function seedCollection(name, docs) {
  const batch = db.batch();
  for (const d of docs) {
    const { id, ...data } = d;
    batch.set(db.collection(name).doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(`✓ ${name}: ${docs.length} dokumen`);
}

async function main() {
  await seedCollection("prodi", prodi);
  await seedCollection("dosen", dosen);
  await seedCollection("ruangan", ruangan);
  await seedCollection("mataKuliah", mataKuliah);
  await seedCollection("kelas", kelas);
  await seedCollection("periode", periode);
  await seedCollection("jadwal", jadwal);
  console.log("\n✓ Seed selesai untuk project sijadwal-fikes.");
}

main().catch((e) => {
  console.error("\n✗ Gagal seed:", e.message);
  process.exit(1);
});
