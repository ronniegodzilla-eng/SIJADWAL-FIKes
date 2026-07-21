import { slugId } from "./masterSchema";

// Spesifikasi CRUD master per baris — dipakai form (klien) & API (server).
// Nama field = nama field kanonik di Firestore (sama dengan impor Excel).

export type FieldKind = "str" | "num" | "jenjang" | "prodiRef";

export interface CrudField {
  key: string;
  label: string;
  kind: FieldKind;
  required: boolean;
}

export interface CrudSpec {
  collection: string;
  label: string;
  naturalKey: string; // kolom kunci → doc id
  fields: CrudField[];
}

export const MASTER_SPEC: Record<string, CrudSpec> = {
  prodi: {
    collection: "prodi",
    label: "Prodi",
    naturalKey: "kode",
    fields: [
      { key: "kode", label: "Kode", kind: "str", required: true },
      { key: "nama", label: "Nama", kind: "str", required: true },
      { key: "jenjang", label: "Jenjang", kind: "jenjang", required: true },
    ],
  },
  dosen: {
    collection: "dosen",
    label: "Dosen",
    naturalKey: "nidn",
    fields: [
      { key: "nidn", label: "NIDN", kind: "str", required: true },
      { key: "nama", label: "Nama lengkap + gelar", kind: "str", required: true },
    ],
  },
  ruangan: {
    collection: "ruangan",
    label: "Ruangan",
    naturalKey: "kode",
    fields: [
      { key: "kode", label: "Kode", kind: "str", required: true },
      { key: "nama", label: "Nama", kind: "str", required: true },
      { key: "gedung", label: "Gedung / lantai", kind: "str", required: true },
    ],
  },
  mataKuliah: {
    collection: "mataKuliah",
    label: "Mata Kuliah",
    naturalKey: "kode",
    fields: [
      { key: "kode", label: "Kode", kind: "str", required: true },
      { key: "nama", label: "Nama", kind: "str", required: true },
      { key: "sks", label: "SKS", kind: "num", required: true },
      { key: "semesterKe", label: "Semester ke-", kind: "num", required: true },
      { key: "prodiId", label: "Prodi", kind: "prodiRef", required: true },
    ],
  },
  kelas: {
    collection: "kelas",
    label: "Kelas / Rombel",
    naturalKey: "namaRombel",
    fields: [
      { key: "namaRombel", label: "Nama rombel", kind: "str", required: true },
      { key: "prodiId", label: "Prodi", kind: "prodiRef", required: true },
      { key: "angkatan", label: "Angkatan", kind: "num", required: true },
      { key: "semesterKe", label: "Semester berjalan", kind: "num", required: true },
    ],
  },
};

export const isMasterCollection = (c: string): c is keyof typeof MASTER_SPEC =>
  c in MASTER_SPEC;

const isEmpty = (v: unknown) => v === undefined || v === null || String(v).trim() === "";

export interface BuildResult {
  errors: string[];
  data: Record<string, unknown>;
  id: string;
}

/**
 * Validasi + normalisasi satu record. `prodiIds` = himpunan doc id prodi yang
 * ada (untuk validasi referensi). Menghasilkan data siap tulis + doc id.
 */
export function validateAndBuild(
  collection: string,
  raw: Record<string, unknown>,
  prodiIds: Set<string>
): BuildResult {
  const spec = MASTER_SPEC[collection];
  const errors: string[] = [];
  const data: Record<string, unknown> = { aktif: raw.aktif === false ? false : true };

  for (const f of spec.fields) {
    const val = raw[f.key];
    if (f.required && isEmpty(val)) {
      errors.push(`${f.label} wajib diisi.`);
      continue;
    }
    if (isEmpty(val)) continue;

    if (f.kind === "num") {
      const n = typeof val === "number" ? val : Number(String(val).trim());
      if (!Number.isFinite(n) || n <= 0) errors.push(`${f.label} harus angka lebih dari 0.`);
      else data[f.key] = n;
    } else if (f.kind === "jenjang") {
      const s = String(val).trim().toUpperCase();
      if (s !== "S1" && s !== "S2") errors.push(`${f.label} harus S1 atau S2.`);
      else data[f.key] = s;
    } else if (f.kind === "prodiRef") {
      const pid = String(val).trim();
      if (!prodiIds.has(pid)) errors.push(`Prodi tidak dikenal.`);
      else data[f.key] = pid;
    } else {
      data[f.key] = String(val).trim();
    }
  }

  const id = slugId(String(raw[spec.naturalKey] ?? ""));
  if (!id) errors.push(`${spec.fields[0].label} tidak valid.`);
  return { errors, data, id };
}
