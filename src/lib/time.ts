// ── Utilitas waktu — jam disimpan sebagai menit integer (PRD §6) ─────

/** 480 → "08.00" (label tampilan). */
export function m2t(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
}

/** 480 → "08:00" (nilai untuk <input type="time">). */
export function m2hhmm(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** "08:00" → 480 menit. */
export function hhmm2m(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

/** Format desimal SKS gaya Indonesia (1,5). */
export function fmtSks(n: number): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}
