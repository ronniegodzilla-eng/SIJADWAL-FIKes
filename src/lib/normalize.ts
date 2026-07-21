import type { Prodi, Dosen, Ruangan, MataKuliah, Kelas, Periode } from "./types";
import { PRODI_PALETTE } from "./config";

// Normalisasi dokumen Firestore → tipe app. Menerima nama field PRD
// (semesterKe/namaRombel/tanggalMulai) maupun nama internal (sem/nama/mulai).

export type Doc = { id: string } & Record<string, unknown>;

const str = (v: unknown, d = ""): string => (v === undefined || v === null ? d : String(v));
const num = (v: unknown, d = 0): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};
const bool = (v: unknown): boolean => v !== false; // default TRUE

const ID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function fmtDate(v: unknown): string {
  const s = str(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]} ${ID_MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return s;
}

/** Prodi + warna palet stabil (urut kode). */
export function normProdiList(docs: Doc[]): Prodi[] {
  const base = docs.map((d) => ({
    id: d.id,
    kode: str(d.kode),
    nama: str(d.nama),
    jenjang: (str(d.jenjang).toUpperCase() === "S2" ? "S2" : "S1") as "S1" | "S2",
    aktif: bool(d.aktif),
  }));
  const order = [...base].sort((a, b) => a.kode.localeCompare(b.kode));
  const colorFor = new Map<string, (typeof PRODI_PALETTE)[number]>();
  order.forEach((p, i) => colorFor.set(p.id, PRODI_PALETTE[i % PRODI_PALETTE.length]));
  return base
    .sort((a, b) => a.kode.localeCompare(b.kode))
    .map((p) => ({ ...p, ...colorFor.get(p.id)! }));
}

export function normDosenList(docs: Doc[]): Dosen[] {
  return docs
    .map((d) => ({ id: d.id, nidn: str(d.nidn), nama: str(d.nama), aktif: bool(d.aktif) }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

export function normRuanganList(docs: Doc[]): Ruangan[] {
  return docs
    .map((d) => ({ id: d.id, kode: str(d.kode), nama: str(d.nama), gedung: str(d.gedung), aktif: bool(d.aktif) }))
    .sort((a, b) => a.kode.localeCompare(b.kode));
}

export function normMkList(docs: Doc[]): MataKuliah[] {
  return docs
    .map((d) => ({
      id: d.id,
      kode: str(d.kode),
      nama: str(d.nama),
      sks: num(d.sks),
      sem: num(d.sem ?? d.semesterKe),
      prodiId: str(d.prodiId),
      aktif: bool(d.aktif),
    }))
    .sort((a, b) => a.kode.localeCompare(b.kode));
}

export function normKelasList(docs: Doc[]): Kelas[] {
  return docs
    .map((d) => ({
      id: d.id,
      nama: str(d.nama ?? d.namaRombel),
      prodiId: str(d.prodiId),
      sem: num(d.sem ?? d.semesterKe),
      angkatan: num(d.angkatan) || undefined,
      aktif: bool(d.aktif),
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

export function normPeriodeList(docs: Doc[]): Periode[] {
  return docs
    .map((d) => ({
      id: d.id,
      nama: str(d.nama),
      aktif: d.aktif === true,
      mulai: fmtDate(d.mulai ?? d.tanggalMulai),
      selesai: fmtDate(d.selesai ?? d.tanggalSelesai),
    }))
    .sort((a, b) => (a.aktif === b.aktif ? a.nama.localeCompare(b.nama) : a.aktif ? -1 : 1));
}
