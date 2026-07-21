import "server-only";

import ExcelJS from "exceljs";
import { SHEETS, type ParsedSheet, type ParsedRow } from "./masterSchema";

/** Bangun workbook template (.xlsx) dengan 5 sheet + contoh baris. */
export async function buildTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIJADWAL FIKes";
  wb.created = new Date();

  // Sheet petunjuk.
  const info = wb.addWorksheet("Petunjuk");
  info.columns = [{ width: 100 }];
  const lines = [
    "TEMPLATE IMPOR MASTER DATA — SIJADWAL FIKes",
    "",
    "• Isi tiap sheet (Prodi, Dosen, Ruangan, MataKuliah, Kelas) sesuai kolomnya.",
    "• Baris pertama tiap sheet adalah judul kolom — JANGAN diubah/dihapus.",
    "• Baris contoh boleh Anda timpa atau hapus.",
    "• Kolom 'aktif' boleh dikosongkan (dianggap TRUE).",
    "• Kolom 'prodi' di MataKuliah & Kelas diisi KODE prodi (mis. K3) yang ada di sheet Prodi.",
    "• Impor bersifat UPSERT: baris dengan kode/NIDN/rombel sama akan memperbarui data lama.",
    "• Jika ADA satu baris error pun, seluruh impor dibatalkan sampai file bersih.",
  ];
  lines.forEach((t, i) => {
    const cell = info.getCell(`A${i + 1}`);
    cell.value = t;
    if (i === 0) cell.font = { bold: true, size: 13 };
  });

  for (const def of SHEETS) {
    const ws = wb.addWorksheet(def.name);
    ws.columns = def.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: Math.max(14, c.header.length + 6),
    }));
    // Baris judul tebal + latar.
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6F3EB" },
    };
    // Baris contoh.
    const example: Record<string, unknown> = {};
    def.columns.forEach((c) => (example[c.key] = c.example));
    ws.addRow(example);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function cellText(v: unknown): unknown {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    const o = v as { text?: unknown; result?: unknown; richText?: { text: string }[] };
    if (Array.isArray(o.richText)) return o.richText.map((t) => t.text).join("");
    if (o.text !== undefined) return o.text;
    if (o.result !== undefined) return o.result;
  }
  return v;
}

/** Parse workbook unggahan → baris per sheet (mengikuti SHEETS). */
export async function parseWorkbook(buffer: Buffer): Promise<ParsedSheet[]> {
  const wb = new ExcelJS.Workbook();
  // Cast: @types/node Buffer generik vs Buffer bawaan exceljs.
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const result: ParsedSheet[] = [];

  for (const def of SHEETS) {
    const ws = wb.getWorksheet(def.name);
    if (!ws) {
      result.push({ name: def.name, rows: [] });
      continue;
    }

    // Petakan posisi kolom dari baris judul (cocokkan header, case-insensitive).
    const headerRow = ws.getRow(1);
    const posToKey = new Map<number, string>();
    headerRow.eachCell((cell, col) => {
      const h = String(cellText(cell.value)).trim().toLowerCase();
      const match = def.columns.find((c) => c.header.toLowerCase() === h);
      if (match) posToKey.set(col, match.key);
    });

    const rows: ParsedRow[] = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const obj: ParsedRow = { _row: r };
      let hasValue = false;
      posToKey.forEach((key, col) => {
        const val = cellText(row.getCell(col).value);
        if (String(val).trim() !== "") hasValue = true;
        obj[key] = val;
      });
      if (hasValue) rows.push(obj);
    }
    result.push({ name: def.name, rows });
  }

  return result;
}
