// Skema & validasi impor master data massal (dipakai server-side).
// Satu workbook Excel, 5 sheet. Aturan: upsert per kunci natural, dan
// "tolak semua sampai bersih" (impor hanya jika 0 error).

export type FieldType = "string" | "number" | "boolean" | "jenjang";

export interface ColumnDef {
  key: string; // nama field kanonik (Firestore)
  header: string; // judul kolom di Excel
  type: FieldType;
  required: boolean;
  ref?: "prodi"; // nilai harus merujuk kode prodi yang ada
  example: string | number | boolean;
  note?: string;
}

export interface SheetDef {
  name: string; // nama sheet Excel
  collection: string; // koleksi Firestore
  naturalKey: string; // kolom kunci untuk upsert & doc id
  label: string; // label ramah
  columns: ColumnDef[];
}

export const SHEETS: SheetDef[] = [
  {
    name: "Prodi",
    collection: "prodi",
    naturalKey: "kode",
    label: "Program Studi",
    columns: [
      { key: "kode", header: "kode", type: "string", required: true, example: "K3" },
      { key: "nama", header: "nama", type: "string", required: true, example: "S1 Keselamatan & Kesehatan Kerja" },
      { key: "jenjang", header: "jenjang", type: "jenjang", required: true, example: "S1", note: "S1 atau S2" },
      { key: "aktif", header: "aktif", type: "boolean", required: false, example: true, note: "TRUE/FALSE (default TRUE)" },
    ],
  },
  {
    name: "Dosen",
    collection: "dosen",
    naturalKey: "nidn",
    label: "Dosen",
    columns: [
      { key: "nidn", header: "nidn", type: "string", required: true, example: "0412078901" },
      { key: "nama", header: "nama", type: "string", required: true, example: "Dr. Andi Wijaya, M.K.K.K." },
      { key: "aktif", header: "aktif", type: "boolean", required: false, example: true },
    ],
  },
  {
    name: "Ruangan",
    collection: "ruangan",
    naturalKey: "kode",
    label: "Ruangan",
    columns: [
      { key: "kode", header: "kode", type: "string", required: true, example: "A201" },
      { key: "nama", header: "nama", type: "string", required: true, example: "Ruang A201" },
      { key: "gedung", header: "gedung", type: "string", required: true, example: "Gedung A · Lt.2" },
      { key: "aktif", header: "aktif", type: "boolean", required: false, example: true },
    ],
  },
  {
    name: "MataKuliah",
    collection: "mataKuliah",
    naturalKey: "kode",
    label: "Mata Kuliah",
    columns: [
      { key: "kode", header: "kode", type: "string", required: true, example: "K3101" },
      { key: "nama", header: "nama", type: "string", required: true, example: "Toksikologi Industri" },
      { key: "sks", header: "sks", type: "number", required: true, example: 3 },
      { key: "semesterKe", header: "semester", type: "number", required: true, example: 4 },
      { key: "prodiKode", header: "prodi", type: "string", required: true, ref: "prodi", example: "K3", note: "kode prodi" },
      { key: "aktif", header: "aktif", type: "boolean", required: false, example: true },
    ],
  },
  {
    name: "Kelas",
    collection: "kelas",
    naturalKey: "namaRombel",
    label: "Kelas / Rombel",
    columns: [
      { key: "namaRombel", header: "rombel", type: "string", required: true, example: "K3-2024-A" },
      { key: "prodiKode", header: "prodi", type: "string", required: true, ref: "prodi", example: "K3", note: "kode prodi" },
      { key: "angkatan", header: "angkatan", type: "number", required: true, example: 2024 },
      { key: "semesterKe", header: "semester", type: "number", required: true, example: 4 },
      { key: "aktif", header: "aktif", type: "boolean", required: false, example: true },
    ],
  },
];

export const sheetByName = (name: string) => SHEETS.find((s) => s.name === name);

/** doc id deterministik dari kunci natural (slug). */
export function slugId(v: string): string {
  return String(v)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Tipe input & hasil ──────────────────────────────────────────────
export interface ParsedRow {
  _row: number; // nomor baris Excel (untuk pesan error)
  [key: string]: unknown;
}
export interface ParsedSheet {
  name: string;
  rows: ParsedRow[];
}
export interface RowError {
  sheet: string;
  row: number;
  column?: string;
  message: string;
}
export interface MasterDoc {
  collection: string;
  id: string;
  data: Record<string, unknown>;
}
export interface ValidateResult {
  errors: RowError[];
  docs: MasterDoc[];
  counts: Record<string, number>; // per label: jumlah baris siap upsert
}

function parseBoolean(v: unknown): boolean | null {
  if (v === undefined || v === null || v === "") return true; // default aktif
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "ya", "yes", "aktif"].includes(s)) return true;
  if (["false", "0", "tidak", "no", "nonaktif"].includes(s)) return false;
  return null;
}

function parseNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const isEmpty = (v: unknown) => v === undefined || v === null || String(v).trim() === "";

/**
 * Validasi seluruh workbook. Menghasilkan daftar error + dokumen siap upsert.
 * @param sheets              hasil parse Excel (baris per sheet)
 * @param existingProdiKodes  kode prodi yang sudah ada di Firestore (uppercase)
 */
export function validateWorkbook(
  sheets: ParsedSheet[],
  existingProdiKodes: Set<string>
): ValidateResult {
  const errors: RowError[] = [];
  const docs: MasterDoc[] = [];
  const counts: Record<string, number> = {};

  // Himpunan kode prodi valid = yang sudah ada ∪ yang ada di sheet Prodi.
  const prodiKodes = new Set<string>(existingProdiKodes);
  const prodiSheet = sheets.find((s) => s.name === "Prodi");
  if (prodiSheet) {
    for (const r of prodiSheet.rows) {
      const k = r["kode"];
      if (!isEmpty(k)) prodiKodes.add(String(k).trim().toUpperCase());
    }
  }

  for (const def of SHEETS) {
    const sheet = sheets.find((s) => s.name === def.name);
    if (!sheet) continue; // sheet boleh dikosongkan
    counts[def.label] = 0;
    const seenKeys = new Map<string, number>(); // kunci natural → baris pertama

    for (const row of sheet.rows) {
      const rowErrsBefore = errors.length;
      const out: Record<string, unknown> = {};

      for (const col of def.columns) {
        const raw = row[col.key];

        if (col.required && isEmpty(raw)) {
          errors.push({ sheet: def.name, row: row._row, column: col.header, message: `Kolom "${col.header}" wajib diisi.` });
          continue;
        }
        if (!col.required && isEmpty(raw) && col.type !== "boolean") continue;

        if (col.type === "number") {
          const n = parseNumber(raw);
          if (n === null) {
            errors.push({ sheet: def.name, row: row._row, column: col.header, message: `"${col.header}" harus berupa angka (nilai: "${raw}").` });
          } else if (n <= 0) {
            errors.push({ sheet: def.name, row: row._row, column: col.header, message: `"${col.header}" harus lebih dari 0.` });
          } else out[col.key] = n;
        } else if (col.type === "boolean") {
          const b = parseBoolean(raw);
          if (b === null) {
            errors.push({ sheet: def.name, row: row._row, column: col.header, message: `"${col.header}" harus TRUE atau FALSE.` });
          } else out[col.key] = b;
        } else if (col.type === "jenjang") {
          const s = String(raw).trim().toUpperCase();
          if (s !== "S1" && s !== "S2") {
            errors.push({ sheet: def.name, row: row._row, column: col.header, message: `"${col.header}" harus S1 atau S2.` });
          } else out[col.key] = s;
        } else {
          out[col.key] = String(raw).trim();
        }

        // Referensi prodi.
        if (col.ref === "prodi" && !isEmpty(raw)) {
          const k = String(raw).trim().toUpperCase();
          if (!prodiKodes.has(k)) {
            errors.push({ sheet: def.name, row: row._row, column: col.header, message: `Prodi "${raw}" tidak ditemukan (tambahkan di sheet Prodi atau pastikan sudah ada).` });
          }
        }
      }

      // Kunci natural & duplikat dalam file.
      const keyRaw = row[def.naturalKey];
      if (!isEmpty(keyRaw)) {
        const norm = String(keyRaw).trim().toUpperCase();
        if (seenKeys.has(norm)) {
          errors.push({ sheet: def.name, row: row._row, column: def.naturalKey, message: `Duplikat "${keyRaw}" (sudah ada di baris ${seenKeys.get(norm)} pada file ini).` });
        } else {
          seenKeys.set(norm, row._row);
        }
      }

      // Jika baris ini bersih, siapkan dokumen upsert.
      if (errors.length === rowErrsBefore && !isEmpty(keyRaw)) {
        const data: Record<string, unknown> = { aktif: out.aktif ?? true };
        for (const col of def.columns) {
          if (col.key === "aktif") continue;
          if (col.key === "prodiKode") {
            data.prodiId = slugId(String(out.prodiKode));
          } else if (col.key in out) {
            data[col.key] = out[col.key];
          }
        }
        docs.push({ collection: def.collection, id: slugId(String(keyRaw)), data });
        counts[def.label] = (counts[def.label] || 0) + 1;
      }
    }
  }

  return { errors, docs, counts };
}
