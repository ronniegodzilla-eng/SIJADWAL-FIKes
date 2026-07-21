// ── Model data (mengikuti PRD §6) ────────────────────────────────────

export type Jenjang = "S1" | "S2";
export type Peran = "petugas" | "admin";
export type Mode = "offline" | "online";

export interface Prodi {
  id: string;
  kode: string;
  nama: string;
  jenjang: Jenjang;
  /** Warna pembeda prodi, konsisten di grid/badge/legenda. */
  color: string;
  bg: string;
  ring: string;
  aktif?: boolean;
}

export interface Dosen {
  id: string;
  nidn: string;
  nama: string;
  aktif?: boolean;
}

export interface Ruangan {
  id: string;
  kode: string;
  nama: string;
  gedung: string;
  aktif?: boolean;
}

export interface MataKuliah {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  /** Semester ke- */
  sem: number;
  prodiId: string;
  aktif?: boolean;
}

export interface Kelas {
  id: string;
  nama: string;
  prodiId: string;
  /** Semester berjalan */
  sem: number;
  aktif?: boolean;
}

export interface Periode {
  id: string;
  nama: string;
  aktif: boolean;
  mulai: string;
  selesai: string;
}

export interface AppUser {
  nama: string;
  email: string;
  peran: Peran;
  prodiId: string | null;
  aktif?: boolean;
}

export interface OverrideWarning {
  kode: string;
  userId: string;
  timestamp: number;
}

/** Entri jadwal seperti disimpan (raw). */
export interface JadwalRaw {
  id: string;
  mkId: string;
  kelasId: string;
  dosenIds: string[];
  mode: Mode;
  ruanganId: string | null;
  /** 1=Senin .. 6=Sabtu */
  hari: number;
  /** menit sejak 00.00 (mis. 480 = 08.00) */
  jamMulai: number;
  periodeId?: string;
  overrideWarnings?: OverrideWarning[];
  dibuatOleh?: string;
  dibuatPada?: number;
  diubahOleh?: string;
  diubahPada?: number;
}

/** Entri jadwal setelah diperkaya (turunan). */
export interface Jadwal extends JadwalRaw {
  jamSelesai: number;
  /** sks / jumlah dosen (desimal, jangan dibulatkan) */
  sksEff: number;
  prodiId: string;
}

/** Draft form input jadwal. */
export interface FormDraft {
  mataKuliahId: string;
  kelasId: string;
  dosenIds: string[];
  mode: Mode;
  ruanganId: string;
  hari: number;
  jamMulai: number;
}

export interface ConflictItem {
  kode: "C1" | "C2" | "C3";
  judul: string;
  detail: string;
}

export interface WarningItem {
  kode: "W1" | "W2";
  judul: string;
  detail: string;
}

export interface ValidationResult {
  conflicts: ConflictItem[];
  warnings: WarningItem[];
  complete: boolean;
}
