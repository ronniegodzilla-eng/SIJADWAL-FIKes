import type { Jadwal, Mode } from "./types";
import { Catalog, mkById } from "./catalog";
import {
  MENIT_PER_SKS,
  DAYS,
  JAM_MULAI_OPERASIONAL,
  JAM_SELESAI_OPERASIONAL,
  SLOT_STEP,
} from "./config";
import { m2t } from "./time";

export interface SlotParam {
  mataKuliahId: string;
  kelasId: string;
  dosenIds: string[];
  mode: Mode;
  ruanganId: string;
}

export interface SlotHit {
  start: number;
  end: number;
  label: string;
}

export interface SlotRow {
  hari: number;
  day: string;
  empty: boolean;
  slots: SlotHit[];
}

export interface SlotResult {
  rows: SlotRow[];
  summary: string;
  count: number;
}

/**
 * Cari slot kosong (PRD §F6) — rentang waktu per hari yang lolos C1–C3
 * untuk kombinasi dosen + kelas + durasi (jam operasional 07.00–21.00).
 */
export function cariSlot(
  cat: Catalog,
  jadwal: Jadwal[],
  param: SlotParam
): SlotResult {
  const mk = mkById(cat, param.mataKuliahId);
  if (!mk || !param.dosenIds.length || !param.kelasId) {
    return {
      rows: [],
      count: 0,
      summary: "Lengkapi mata kuliah, kelas, dan minimal satu dosen.",
    };
  }

  const dur = mk.sks * MENIT_PER_SKS;
  const rows: SlotRow[] = [];
  let count = 0;

  for (let d = 1; d <= 6; d++) {
    const slots: SlotHit[] = [];
    for (
      let start = JAM_MULAI_OPERASIONAL;
      start + dur <= JAM_SELESAI_OPERASIONAL;
      start += SLOT_STEP
    ) {
      const end = start + dur;
      const busy = jadwal.some((j) => {
        if (j.hari !== d) return false;
        if (!(start < j.jamSelesai && j.jamMulai < end)) return false;
        const dosenClash = param.dosenIds.some((id) => j.dosenIds.includes(id));
        const kelasClash = j.kelasId === param.kelasId;
        const roomClash =
          param.mode === "offline" &&
          j.mode === "offline" &&
          !!param.ruanganId &&
          j.ruanganId === param.ruanganId;
        return dosenClash || kelasClash || roomClash;
      });
      if (!busy) slots.push({ start, end, label: `${m2t(start)}–${m2t(end)}` });
    }
    // Ambil representatif tiap ~1 jam agar daftar ringkas.
    const picked = slots.filter((_, i) => i % 2 === 0).slice(0, 6);
    count += picked.length;
    rows.push({
      hari: d,
      day: DAYS[d],
      empty: picked.length === 0,
      slots: picked,
    });
  }

  return {
    rows,
    count,
    summary: `${count} slot ditemukan untuk ${mk.nama} · ${dur} menit · ${param.dosenIds.length} dosen.`,
  };
}
