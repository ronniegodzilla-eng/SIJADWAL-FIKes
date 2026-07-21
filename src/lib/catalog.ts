import type {
  Prodi,
  Dosen,
  Ruangan,
  MataKuliah,
  Kelas,
  Jadwal,
  JadwalRaw,
} from "./types";
import { MENIT_PER_SKS } from "./config";

/** Kumpulan master data + helper lookup. */
export interface Catalog {
  prodi: Prodi[];
  dosen: Dosen[];
  ruangan: Ruangan[];
  mk: MataKuliah[];
  kelas: Kelas[];
}

export function mkById(cat: Catalog, id: string | null | undefined) {
  return cat.mk.find((m) => m.id === id);
}
export function kelasById(cat: Catalog, id: string | null | undefined) {
  return cat.kelas.find((k) => k.id === id);
}
export function dosenById(cat: Catalog, id: string | null | undefined) {
  return cat.dosen.find((d) => d.id === id);
}
export function ruanganById(cat: Catalog, id: string | null | undefined) {
  return cat.ruangan.find((r) => r.id === id);
}
export function prodiById(cat: Catalog, id: string | null | undefined) {
  return cat.prodi.find((p) => p.id === id);
}

/** Nama dosen ringkas (buang gelar setelah koma). */
export function dosenShort(cat: Catalog, id: string): string {
  const d = dosenById(cat, id);
  if (!d) return "";
  return d.nama.split(",")[0];
}

/** Nama dosen ringkas tanpa prefiks gelar depan (Dr./Prof.) untuk blok grid. */
export function dosenGridLabel(cat: Catalog, id: string): string {
  return dosenShort(cat, id).replace(/^(Dr\.|Prof\. dr\.|Prof\.)\s*/, "");
}

/**
 * Perkaya entri jadwal (turunan): jamSelesai, sksEff, prodiId.
 * jamSelesai = jamMulai + sks × 50 (PRD F3/F4).
 * sksEff = sks / jumlah dosen, desimal, tidak dibulatkan (PRD F4 catatan W2).
 */
export function enrich(cat: Catalog, j: JadwalRaw): Jadwal {
  const mk = mkById(cat, j.mkId);
  const sks = mk?.sks ?? 0;
  const jamSelesai = j.jamMulai + sks * MENIT_PER_SKS;
  return {
    ...j,
    jamSelesai,
    sksEff: j.dosenIds.length ? sks / j.dosenIds.length : sks,
    prodiId: mk?.prodiId ?? "",
  };
}
