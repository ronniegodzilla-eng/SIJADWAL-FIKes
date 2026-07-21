import type {
  Jadwal,
  FormDraft,
  ValidationResult,
  ConflictItem,
  WarningItem,
} from "./types";
import {
  Catalog,
  mkById,
  kelasById,
  ruanganById,
  dosenShort,
} from "./catalog";
import { MENIT_PER_SKS, BATAS_SKS, BATAS_SESI_BERURUTAN, DAYS } from "./config";
import { m2t, fmtSks } from "./time";

/**
 * Overlap dua entri (PRD §F4):
 *   overlap = hari sama DAN aMulai < bSelesai DAN bMulai < aSelesai
 */
function overlaps(aMulai: number, aSelesai: number, b: Jadwal): boolean {
  return aMulai < b.jamSelesai && b.jamMulai < aSelesai;
}

/** Deskripsi entri bentrok untuk pesan validasi. */
function describe(cat: Catalog, b: Jadwal): string {
  const mk = mkById(cat, b.mkId);
  const kls = kelasById(cat, b.kelasId);
  const room = b.mode === "online" ? "ONLINE" : ruanganById(cat, b.ruanganId)?.kode;
  return `${mk?.nama} (${kls?.nama}) ${DAYS[b.hari]} ${m2t(b.jamMulai)}–${m2t(
    b.jamSelesai
  )}, ${room}`;
}

/**
 * Mesin validasi bentrok F4.
 * @param cat     master data
 * @param jadwal  seluruh entri periode aktif (semua prodi)
 * @param form    draft yang divalidasi
 * @param editId  id entri yang sedang diedit (dikecualikan dari pembanding)
 */
export function validate(
  cat: Catalog,
  jadwal: Jadwal[],
  form: FormDraft,
  editId: string | null
): ValidationResult {
  const mk = mkById(cat, form.mataKuliahId);
  const conflicts: ConflictItem[] = [];
  const warnings: WarningItem[] = [];

  const complete = !!(
    mk &&
    form.dosenIds.length &&
    form.hari &&
    form.jamMulai != null
  );
  if (!complete || !mk) return { conflicts, warnings, complete };

  const dur = mk.sks * MENIT_PER_SKS;
  const aStart = form.jamMulai;
  const aEnd = form.jamMulai + dur;
  const others = jadwal.filter((j) => j.id !== editId);

  // ── C1–C3: hard block ──────────────────────────────────────────────
  for (const b of others) {
    const overlap = b.hari === Number(form.hari) && overlaps(aStart, aEnd, b);
    if (!overlap) continue;

    // C1 — Bentrok dosen (berlaku juga untuk sesi online)
    const shared = form.dosenIds.filter((d) => b.dosenIds.includes(d));
    if (shared.length) {
      conflicts.push({
        kode: "C1",
        judul: "Bentrok dosen",
        detail: `${dosenShort(cat, shared[0])} sudah mengajar ${describe(cat, b)}.`,
      });
    }

    // C2 — Bentrok kelas (berlaku juga untuk sesi online)
    if (form.kelasId && b.kelasId === form.kelasId) {
      conflicts.push({
        kode: "C2",
        judul: "Bentrok kelas",
        detail: `${kelasById(cat, form.kelasId)?.nama} sudah terjadwal: ${describe(
          cat,
          b
        )}.`,
      });
    }

    // C3 — Bentrok ruangan (hanya jika kedua entri offline)
    if (
      form.mode === "offline" &&
      b.mode === "offline" &&
      form.ruanganId &&
      b.ruanganId === form.ruanganId
    ) {
      conflicts.push({
        kode: "C3",
        judul: "Bentrok ruangan",
        detail: `${ruanganById(cat, form.ruanganId)?.kode} dipakai: ${describe(
          cat,
          b
        )}.`,
      });
    }
  }

  // ── W2: beban SKS > 16 per dosen (akumulasi lintas prodi) ───────────
  const eff = mk.sks / form.dosenIds.length;
  for (const dId of form.dosenIds) {
    const total =
      others
        .filter((j) => j.dosenIds.includes(dId))
        .reduce((s, j) => s + j.sksEff, 0) + eff;
    if (total > BATAS_SKS) {
      warnings.push({
        kode: "W2",
        judul: "Beban SKS berlebih",
        detail: `Total beban ${dosenShort(cat, dId)} menjadi ${fmtSks(
          total
        )} SKS (batas ${BATAS_SKS}).`,
      });
    }
  }

  // ── W1: >3 sesi bersambung/beririsan dalam satu hari ────────────────
  for (const dId of form.dosenIds) {
    const sessions = others
      .filter((j) => j.dosenIds.includes(dId) && j.hari === Number(form.hari))
      .map((j) => ({ s: j.jamMulai, e: j.jamSelesai }));
    sessions.push({ s: aStart, e: aEnd });
    sessions.sort((a, b) => a.s - b.s);
    let chain = 1;
    let max = 1;
    for (let i = 1; i < sessions.length; i++) {
      if (sessions[i].s <= sessions[i - 1].e) {
        chain++;
        max = Math.max(max, chain);
      } else {
        chain = 1;
      }
    }
    if (max > BATAS_SESI_BERURUTAN) {
      warnings.push({
        kode: "W1",
        judul: "Sesi berturut-turut",
        detail: `${dosenShort(cat, dId)} memiliki ${max} sesi bersambung pada ${
          DAYS[Number(form.hari)]
        }.`,
      });
    }
  }

  return { conflicts, warnings, complete };
}
