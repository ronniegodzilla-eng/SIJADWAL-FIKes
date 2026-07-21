import type {
  Prodi,
  Dosen,
  Ruangan,
  MataKuliah,
  Kelas,
  Periode,
  AppUser,
  JadwalRaw,
} from "./types";

// ── Data contoh (dipakai di MODE DEMO & sebagai seed Firestore) ──────
// Diambil dari prototipe Claude Design SIJADWAL-FIKes.

export const seedProdi: Prodi[] = [
  { id: "k3", kode: "K3", nama: "S1 Keselamatan & Kesehatan Kerja", jenjang: "S1", color: "#0E9F6E", bg: "#E4F6EE", ring: "#B6E6D2", aktif: true },
  { id: "kesling", kode: "KESLING", nama: "S1 Kesehatan Lingkungan", jenjang: "S1", color: "#2A6FD6", bg: "#E7EFFB", ring: "#BDD3F4", aktif: true },
  { id: "kesmas", kode: "KESMAS", nama: "S2 Kesehatan Masyarakat", jenjang: "S2", color: "#8A3FB8", bg: "#F3E9FA", ring: "#DEC4EF", aktif: true },
];

export const seedDosen: Dosen[] = [
  { id: "d1", nidn: "0412078901", nama: "Dr. Andi Wijaya, M.K.K.K.", aktif: true },
  { id: "d2", nidn: "0421058802", nama: "Rina Marlina, S.K.M., M.Kes.", aktif: true },
  { id: "d3", nidn: "0409118503", nama: "Dr. Hendra Gunawan, M.Si.", aktif: true },
  { id: "d4", nidn: "0417039004", nama: "Siti Rahmawati, S.K.M., M.Epid.", aktif: true },
  { id: "d5", nidn: "0402128705", nama: "Budi Santoso, S.T., M.K.K.K.", aktif: true },
  { id: "d6", nidn: "0428077606", nama: "Prof. dr. Laila Hasan, M.P.H.", aktif: true },
  { id: "d7", nidn: "0415098907", nama: "Dedi Kurniawan, S.K.M., M.Kes.", aktif: true },
  { id: "d8", nidn: "0406018808", nama: "Fitri Handayani, S.Si., M.Kes.", aktif: true },
];

export const seedRuangan: Ruangan[] = [
  { id: "r1", kode: "A201", nama: "Ruang A201", gedung: "Gedung A · Lt.2", aktif: true },
  { id: "r2", kode: "A202", nama: "Ruang A202", gedung: "Gedung A · Lt.2", aktif: true },
  { id: "r3", kode: "B203", nama: "Ruang B203", gedung: "Gedung B · Lt.2", aktif: true },
  { id: "r4", kode: "B305", nama: "Ruang B305", gedung: "Gedung B · Lt.3", aktif: true },
  { id: "r5", kode: "LAB-K3", nama: "Lab K3", gedung: "Gedung C · Lt.1", aktif: true },
];

export const seedMataKuliah: MataKuliah[] = [
  { id: "m1", kode: "K3101", nama: "Toksikologi Industri", sks: 3, sem: 4, prodiId: "k3", aktif: true },
  { id: "m2", kode: "K3102", nama: "Higiene Industri", sks: 2, sem: 4, prodiId: "k3", aktif: true },
  { id: "m3", kode: "K3103", nama: "Sistem Manajemen K3", sks: 2, sem: 6, prodiId: "k3", aktif: true },
  { id: "m4", kode: "KL201", nama: "Pencemaran Lingkungan", sks: 3, sem: 4, prodiId: "kesling", aktif: true },
  { id: "m5", kode: "KL202", nama: "Analisis Risiko Kesehatan Lingkungan", sks: 2, sem: 6, prodiId: "kesling", aktif: true },
  { id: "m6", kode: "KM301", nama: "Epidemiologi Lanjut", sks: 3, sem: 2, prodiId: "kesmas", aktif: true },
  { id: "m7", kode: "KM302", nama: "Biostatistik", sks: 3, sem: 2, prodiId: "kesmas", aktif: true },
  { id: "m8", kode: "KM303", nama: "Surveilans Kesehatan", sks: 2, sem: 2, prodiId: "kesmas", aktif: true },
];

export const seedKelas: Kelas[] = [
  { id: "kls-k3-24a", nama: "K3-2024-A", prodiId: "k3", sem: 4, aktif: true },
  { id: "kls-k3-23a", nama: "K3-2023-A", prodiId: "k3", sem: 6, aktif: true },
  { id: "kls-k3-22a", nama: "K3-2022-A", prodiId: "k3", sem: 8, aktif: true },
  { id: "kls-kl-24a", nama: "KESLING-2024-A", prodiId: "kesling", sem: 4, aktif: true },
  { id: "kls-kl-23a", nama: "KESLING-2023-A", prodiId: "kesling", sem: 6, aktif: true },
  { id: "kls-km-25a", nama: "KESMAS-2025-A", prodiId: "kesmas", sem: 2, aktif: true },
];

export const seedPeriode: Periode[] = [
  { id: "p1", nama: "Ganjil 2026/2027", aktif: true, mulai: "01 Sep 2026", selesai: "31 Jan 2027" },
  { id: "p0", nama: "Genap 2025/2026", aktif: false, mulai: "01 Feb 2026", selesai: "30 Jun 2026" },
  { id: "p2", nama: "Genap 2026/2027", aktif: false, mulai: "01 Feb 2027", selesai: "30 Jun 2027" },
];

export const seedUsers: AppUser[] = [
  { nama: "Roni Saputra, M.Si.", email: "admin.fikes@uis.ac.id", peran: "admin", prodiId: null, aktif: true },
  { nama: "Wulan Sari", email: "petugas.k3@uis.ac.id", peran: "petugas", prodiId: "k3", aktif: true },
  { nama: "Agus Priyanto", email: "petugas.kesling@uis.ac.id", peran: "petugas", prodiId: "kesling", aktif: true },
  { nama: "Maya Puspita", email: "petugas.kesmas@uis.ac.id", peran: "petugas", prodiId: "kesmas", aktif: true },
];

export const seedJadwal: JadwalRaw[] = [
  { id: "j1", mkId: "m6", kelasId: "kls-km-25a", dosenIds: ["d3"], mode: "offline", ruanganId: "r3", hari: 1, jamMulai: 480 },
  { id: "j2", mkId: "m1", kelasId: "kls-k3-24a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 1, jamMulai: 480 },
  { id: "j3", mkId: "m7", kelasId: "kls-km-25a", dosenIds: ["d4"], mode: "offline", ruanganId: "r3", hari: 1, jamMulai: 640 },
  { id: "j4", mkId: "m2", kelasId: "kls-k3-24a", dosenIds: ["d5"], mode: "offline", ruanganId: "r5", hari: 1, jamMulai: 640 },
  { id: "j5", mkId: "m4", kelasId: "kls-kl-24a", dosenIds: ["d6"], mode: "offline", ruanganId: "r2", hari: 2, jamMulai: 480 },
  { id: "j6", mkId: "m2", kelasId: "kls-k3-23a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 2, jamMulai: 480 },
  { id: "j7", mkId: "m5", kelasId: "kls-kl-23a", dosenIds: ["d3"], mode: "online", ruanganId: null, hari: 2, jamMulai: 640 },
  { id: "j8", mkId: "m8", kelasId: "kls-km-25a", dosenIds: ["d3", "d4"], mode: "offline", ruanganId: "r4", hari: 3, jamMulai: 480 },
  { id: "j9", mkId: "m3", kelasId: "kls-k3-23a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 2, jamMulai: 640 },
  { id: "j10", mkId: "m4", kelasId: "kls-kl-23a", dosenIds: ["d6"], mode: "offline", ruanganId: "r2", hari: 3, jamMulai: 480 },
  { id: "j11", mkId: "m1", kelasId: "kls-k3-23a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 3, jamMulai: 480 },
  { id: "j12", mkId: "m5", kelasId: "kls-kl-24a", dosenIds: ["d3"], mode: "online", ruanganId: null, hari: 4, jamMulai: 660 },
  { id: "j13", mkId: "m3", kelasId: "kls-k3-24a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 3, jamMulai: 660 },
  { id: "j14", mkId: "m2", kelasId: "kls-k3-22a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 4, jamMulai: 480 },
  { id: "j15", mkId: "m5", kelasId: "kls-kl-24a", dosenIds: ["d6"], mode: "offline", ruanganId: "r2", hari: 5, jamMulai: 480 },
  { id: "j16", mkId: "m1", kelasId: "kls-k3-22a", dosenIds: ["d1"], mode: "offline", ruanganId: "r1", hari: 5, jamMulai: 480 },
  { id: "j17", mkId: "m8", kelasId: "kls-km-25a", dosenIds: ["d4"], mode: "offline", ruanganId: "r4", hari: 6, jamMulai: 480 },
  { id: "j18", mkId: "m2", kelasId: "kls-k3-23a", dosenIds: ["d5"], mode: "offline", ruanganId: "r5", hari: 6, jamMulai: 480 },
];
