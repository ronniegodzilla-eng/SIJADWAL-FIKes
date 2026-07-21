// ── Konstanta konfigurasi (PRD §4 — A1–A4 harus mudah diubah) ────────

/** Menit per SKS (1 SKS = 50 menit). */
export const MENIT_PER_SKS = 50;

/** Hari perkuliahan (A4: Senin–Sabtu). Index 0 tidak dipakai. */
export const DAYS = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Jam operasional grid, dalam menit sejak 00.00. 07.00–21.00. */
export const JAM_MULAI_OPERASIONAL = 7 * 60; // 420
export const JAM_SELESAI_OPERASIONAL = 21 * 60; // 1260

/** Skala pixel per menit untuk rendering grid. */
export const PX_PER_MENIT = 1.15;

/** Batas beban SKS per dosen per periode (A3). */
export const BATAS_SKS = 16;

/** Batas sesi berturut-turut per dosen per hari (W1). */
export const BATAS_SESI_BERURUTAN = 3;

/** Granularity pencarian slot kosong (menit). */
export const SLOT_STEP = 30;

/**
 * Palet warna prodi (presentasi, dipisah dari data). Diberikan ke prodi secara
 * stabil berdasarkan urutan kode sehingga 3 prodi awal konsisten dengan desain.
 */
export const PRODI_PALETTE = [
  { color: "#0E9F6E", bg: "#E4F6EE", ring: "#B6E6D2" }, // hijau
  { color: "#2A6FD6", bg: "#E7EFFB", ring: "#BDD3F4" }, // biru
  { color: "#8A3FB8", bg: "#F3E9FA", ring: "#DEC4EF" }, // ungu
  { color: "#C2410C", bg: "#FBEBE1", ring: "#F3CDB6" }, // oranye
  { color: "#0E7490", bg: "#E0F2F6", ring: "#B6E0E9" }, // teal
  { color: "#B45309", bg: "#FBF1DE", ring: "#EDD9AE" }, // amber
];
