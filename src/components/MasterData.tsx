"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Catalog, prodiById } from "@/lib/catalog";
import { MASTER_SPEC } from "@/lib/masterCrud";
import { HoverBox } from "./primitives";
import { Combobox } from "./Combobox";
import { greenBtn } from "@/lib/ui";

// Kunci tab = nama koleksi Firestore.
type Tab = "dosen" | "ruangan" | "mataKuliah" | "kelas" | "prodi";

interface Cell {
  text: string | number;
  style?: CSSProperties;
}
interface RowDef {
  item: Record<string, unknown> & { id: string; aktif?: boolean };
  cells: Cell[];
}
interface Table {
  cols: string;
  headers: { label: string; align?: "left" | "center" | "right" }[];
  rows: RowDef[];
}

interface RowError {
  sheet: string;
  row: number;
  column?: string;
  message: string;
}
interface ImportReport {
  ok: boolean;
  errors: RowError[];
  counts: Record<string, number>;
  totalDocs: number;
}

interface Props {
  catalog: Catalog;
  isAdmin: boolean;
  firebaseMode: boolean;
  getToken: () => Promise<string | null>;
}

const strong: CSSProperties = { fontWeight: 700 };
const muted: CSSProperties = { color: "#9AA69E" };

const TABS: [Tab, string][] = [
  ["dosen", "Dosen"],
  ["ruangan", "Ruangan"],
  ["mataKuliah", "Mata Kuliah"],
  ["kelas", "Kelas"],
  ["prodi", "Prodi"],
];

/** Catalog item mentah per tab → dipakai untuk aksi & pra-isi form. */
type AnyItem = Record<string, unknown> & { id: string; aktif?: boolean };

/** Ubah item catalog → nilai form kanonik (nama field Firestore). */
function toFormValues(tab: Tab, item: AnyItem): Record<string, unknown> {
  const aktif = item.aktif !== false;
  switch (tab) {
    case "prodi":
      return { kode: item.kode, nama: item.nama, jenjang: item.jenjang, aktif };
    case "dosen":
      return { nidn: item.nidn, nama: item.nama, aktif };
    case "ruangan":
      return { kode: item.kode, nama: item.nama, gedung: item.gedung, aktif };
    case "mataKuliah":
      return { kode: item.kode, nama: item.nama, sks: item.sks, semesterKe: item.sem, prodiId: item.prodiId, aktif };
    case "kelas":
      return { namaRombel: item.nama, prodiId: item.prodiId, angkatan: item.angkatan, semesterKe: item.sem, aktif };
  }
}

export default function MasterData({ catalog, isAdmin, firebaseMode, getToken }: Props) {
  const [tab, setTab] = useState<Tab>("dosen");
  const [editing, setEditing] = useState<{ item: AnyItem | null } | null>(null);
  const canManage = isAdmin && firebaseMode;

  const api = useCallback(
    async (method: string, path: string, body?: unknown) => {
      const token = await getToken();
      const res = await fetch(path, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || (Array.isArray(data.errors) ? data.errors.join(" ") : `Gagal (${res.status}).`)
        );
      return data;
    },
    [getToken]
  );

  async function toggleAktif(item: AnyItem) {
    const makeInactive = item.aktif !== false;
    try {
      await api("PATCH", `/api/master/${tab}/${item.id}`, { aktif: !makeInactive });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengubah status.");
    }
  }
  async function remove(item: AnyItem) {
    if (!window.confirm("Hapus permanen data ini? Jadwal lama yang memakainya bisa terpengaruh. (Untuk menyembunyikan tanpa menghapus, pakai Nonaktifkan.)"))
      return;
    try {
      await api("DELETE", `/api/master/${tab}/${item.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus.");
    }
  }

  const table = buildTable(catalog, tab);

  return (
    <>
      {canManage && <ImportPanel getToken={getToken} />}
      {isAdmin && !firebaseMode && (
        <div
          style={{
            marginBottom: 16,
            fontSize: 12.5,
            color: "#B0803A",
            background: "#FBF3E0",
            border: "1px solid #ECE0C0",
            padding: "10px 14px",
            borderRadius: 10,
          }}
        >
          Kelola master data (tambah/impor) aktif saat terhubung Firebase.
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid #E3E8E5" }}>
        {TABS.map(([id, label]) => (
          <div
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "11px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              color: tab === id ? "#0F5D2C" : "#7A867E",
              borderBottom: tab === id ? "2.5px solid #1B8A43" : "2.5px solid transparent",
              marginBottom: -1,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13, color: "#6B776F" }}>
          {table.rows.length} data{" "}
          {!isAdmin && (
            <span style={{ color: "#B0803A", fontWeight: 600 }}>
              · Kelola master data hanya untuk Admin Fakultas
            </span>
          )}
        </div>
        {canManage && (
          <HoverBox
            as="button"
            onClick={() => setEditing({ item: null })}
            style={{ ...greenBtn, padding: "8px 14px", fontSize: 12.5 }}
            hoverStyle={{ background: "#167C3C" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tambah {MASTER_SPEC[tab].label}
          </HoverBox>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E3E8E5", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 18px",
            background: "#FAFBFA",
            borderBottom: "1px solid #E9EDEA",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#6B776F",
            display: "grid",
            gridTemplateColumns: table.cols + (canManage ? " 230px" : ""),
          }}
        >
          {table.headers.map((h, i) => (
            <div key={i} style={{ textAlign: h.align ?? "left" }}>
              {h.label}
            </div>
          ))}
          {canManage && <div style={{ textAlign: "right" }}>AKSI</div>}
        </div>
        {table.rows.map((row) => (
          <div
            key={row.item.id}
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid #F2F4F2",
              fontSize: 13,
              display: "grid",
              alignItems: "center",
              gridTemplateColumns: table.cols + (canManage ? " 230px" : ""),
              opacity: row.item.aktif === false ? 0.55 : 1,
            }}
          >
            {row.cells.map((c, ci) => (
              <div key={ci} style={{ fontWeight: 600, ...c.style }}>
                {c.text}
              </div>
            ))}
            {canManage && (
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <MiniBtn label="Edit" bg="#E6F3EB" fg="#0F5D2C" bd="#C4E2CE" onClick={() => setEditing({ item: row.item })} />
                <MiniBtn
                  label={row.item.aktif === false ? "Aktifkan" : "Nonaktif"}
                  bg={row.item.aktif === false ? "#E6F3EB" : "#F1F4F2"}
                  fg={row.item.aktif === false ? "#0F5D2C" : "#5E6B62"}
                  bd={row.item.aktif === false ? "#C4E2CE" : "#DDE4DF"}
                  onClick={() => toggleAktif(row.item)}
                />
                <MiniBtn label="Hapus" bg="#FDECEC" fg="#C4363B" bd="#F5CACA" onClick={() => remove(row.item)} />
              </div>
            )}
          </div>
        ))}
        {table.rows.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: "#9AA69E" }}>Belum ada data.</div>
        )}
      </div>

      {editing && (
        <MasterForm
          tab={tab}
          prodiList={catalog.prodi}
          itemId={editing.item?.id ?? null}
          initial={editing.item ? toFormValues(tab, editing.item) : null}
          api={api}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );

  function buildTable(cat: Catalog, t: Tab): Table {
    const aktifStyle = (on: boolean): CSSProperties => ({
      textAlign: "right",
      color: on ? "#1B8A43" : "#C4363B",
      fontWeight: 700,
    });
    const status = (on: boolean): Cell => ({ text: on ? "Aktif" : "Nonaktif", style: aktifStyle(on) });

    if (t === "dosen")
      return {
        cols: "2.2fr 1.4fr 1fr",
        headers: [{ label: "NAMA" }, { label: "NIDN" }, { label: "STATUS", align: "right" }],
        rows: cat.dosen.map((d) => ({
          item: d as unknown as AnyItem,
          cells: [{ text: d.nama, style: strong }, { text: d.nidn, style: muted }, status(d.aktif !== false)],
        })),
      };
    if (t === "ruangan")
      return {
        cols: "1fr 1.6fr 1.4fr 1fr",
        headers: [{ label: "KODE" }, { label: "NAMA" }, { label: "GEDUNG" }, { label: "STATUS", align: "right" }],
        rows: cat.ruangan.map((r) => ({
          item: r as unknown as AnyItem,
          cells: [{ text: r.kode, style: strong }, { text: r.nama }, { text: r.gedung, style: muted }, status(r.aktif !== false)],
        })),
      };
    if (t === "mataKuliah")
      return {
        cols: "1fr 2.2fr .7fr .7fr 1fr",
        headers: [
          { label: "KODE" },
          { label: "NAMA" },
          { label: "SKS", align: "center" },
          { label: "SEM", align: "center" },
          { label: "PRODI", align: "right" },
        ],
        rows: cat.mk.map((m) => ({
          item: m as unknown as AnyItem,
          cells: [
            { text: m.kode, style: strong },
            { text: m.nama },
            { text: m.sks, style: { textAlign: "center", fontWeight: 700 } },
            { text: m.sem, style: { textAlign: "center", color: "#9AA69E" } },
            { text: prodiById(cat, m.prodiId)?.kode ?? m.prodiId, style: { textAlign: "right", color: "#5E6B62" } },
          ],
        })),
      };
    if (t === "kelas")
      return {
        cols: "1.6fr 1fr .9fr 1fr",
        headers: [
          { label: "ROMBEL" },
          { label: "PRODI" },
          { label: "SEMESTER", align: "center" },
          { label: "STATUS", align: "right" },
        ],
        rows: cat.kelas.map((k) => ({
          item: k as unknown as AnyItem,
          cells: [
            { text: k.nama, style: strong },
            { text: prodiById(cat, k.prodiId)?.kode ?? k.prodiId },
            { text: `Semester ${k.sem}`, style: { textAlign: "center", color: "#9AA69E" } },
            status(k.aktif !== false),
          ],
        })),
      };
    return {
      cols: "1fr 2.4fr 1fr",
      headers: [{ label: "KODE" }, { label: "NAMA" }, { label: "JENJANG", align: "right" }],
      rows: cat.prodi.map((p) => ({
        item: p as unknown as AnyItem,
        cells: [
          { text: p.kode, style: strong },
          { text: p.nama },
          { text: p.jenjang, style: { textAlign: "right", fontWeight: 700, color: "#5E6B62" } },
        ],
      })),
    };
  }
}

function MiniBtn({ label, bg, fg, bd, onClick }: { label: string; bg: string; fg: string; bd: string; onClick: () => void }) {
  return (
    <HoverBox
      onClick={onClick}
      style={{
        padding: "5px 10px",
        background: bg,
        color: fg,
        border: `1px solid ${bd}`,
        borderRadius: 6,
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer",
      }}
      hoverStyle={{ opacity: 0.82 }}
    >
      {label}
    </HoverBox>
  );
}

// ── Form tambah/edit satu record ────────────────────────────────────
const fLabel: CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#3A463F", marginBottom: 6 };
const fInput: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #DDE4DF",
  borderRadius: 9,
  fontSize: 13,
  background: "#fff",
  outline: "none",
};

function MasterForm({
  tab,
  prodiList,
  itemId,
  initial,
  api,
  onClose,
}: {
  tab: Tab;
  prodiList: { id: string; kode: string; nama: string }[];
  itemId: string | null;
  initial: Record<string, unknown> | null;
  api: (method: string, path: string, body?: unknown) => Promise<any>;
  onClose: () => void;
}) {
  const spec = MASTER_SPEC[tab];
  const isEdit = itemId !== null;
  const [values, setValues] = useState<Record<string, unknown>>(
    initial ?? { aktif: true }
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      if (isEdit) await api("PATCH", `/api/master/${tab}/${itemId}`, values);
      else await api("POST", `/api/master/${tab}`, values);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,40,25,.42)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "60px 20px",
        overflow: "auto",
        animation: "sjOverlay .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,.28)",
          animation: "sjPanel .2s ease",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #E9EDEA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {isEdit ? "Edit" : "Tambah"} {spec.label}
          </div>
          <HoverBox onClick={onClose} style={{ cursor: "pointer", color: "#9AA69E", display: "flex" }} hoverStyle={{ color: "#17251C" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </HoverBox>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {spec.fields.map((f) => {
            const locked = isEdit && f.key === spec.naturalKey;
            return (
              <div key={f.key}>
                <label style={fLabel}>
                  {f.label}
                  {locked && <span style={{ color: "#9AA69E", fontWeight: 500 }}> (tidak bisa diubah)</span>}
                </label>
                {f.kind === "prodiRef" ? (
                  <Combobox
                    value={String(values[f.key] ?? "")}
                    options={prodiList.map((p) => ({ value: p.id, label: `${p.kode} — ${p.nama}` }))}
                    onChange={(v) => set(f.key, v)}
                    placeholder="— pilih prodi —"
                  />
                ) : f.kind === "jenjang" ? (
                  <select value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} style={{ ...fInput, cursor: "pointer" }}>
                    <option value="">— pilih —</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                  </select>
                ) : (
                  <input
                    type={f.kind === "num" ? "number" : "text"}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => set(f.key, f.kind === "num" ? e.target.value : e.target.value)}
                    disabled={locked}
                    style={{ ...fInput, background: locked ? "#F1F4F2" : "#fff" }}
                  />
                )}
              </div>
            );
          })}

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#3A463F", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={values.aktif !== false}
              onChange={(e) => set("aktif", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#1B8A43" }}
            />
            Aktif
          </label>

          {err && <div style={{ color: "#C4363B", fontSize: 12.5, fontWeight: 600 }}>{err}</div>}
        </div>

        <div style={{ padding: "0 22px 20px", display: "flex", gap: 8 }}>
          <HoverBox
            as="button"
            onClick={submit}
            disabled={busy}
            style={{ ...greenBtn, flex: 1, justifyContent: "center", opacity: busy ? 0.7 : 1 }}
            hoverStyle={{ background: "#167C3C" }}
          >
            {busy ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan"}
          </HoverBox>
          <HoverBox
            as="button"
            onClick={onClose}
            style={{ padding: "11px 16px", background: "#fff", color: "#5E6B62", border: "1px solid #DDE4DF", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            hoverStyle={{ background: "#F1F4F2" }}
          >
            Batal
          </HoverBox>
        </div>
      </div>
    </div>
  );
}

// ── Panel impor Excel ───────────────────────────────────────────────
function ImportPanel({ getToken }: { getToken: () => Promise<string | null> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function call(path: string, body?: BodyInit) {
    const token = await getToken();
    const res = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/octet-stream" } : {}),
      },
      body,
    });
    return res;
  }

  async function downloadTemplate() {
    setMessage("");
    const res = await call("/api/master/template");
    if (!res.ok) {
      setMessage("Gagal mengunduh template.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-master-sijadwal.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function onPick(f: File) {
    setFile(f);
    setReport(null);
    setMessage("");
    setBusy(true);
    try {
      const res = await call(`/api/master/import?dryRun=1`, f);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Gagal memvalidasi file.");
      } else {
        setReport(data);
      }
    } catch {
      setMessage("Gagal memvalidasi file.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await call(`/api/master/import`, file);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error || "Impor gagal.");
      } else {
        setMessage(`✓ Berhasil mengimpor ${data.imported} baris master data.`);
        setReport(null);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setMessage("Impor gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E3E8E5",
        borderRadius: 14,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Impor Massal (Excel)</div>
          <div style={{ fontSize: 12, color: "#6B776F", marginTop: 2 }}>
            Unduh template, isi, lalu unggah. Baris divalidasi — impor hanya jika seluruhnya benar.
          </div>
        </div>
        <HoverBox
          as="button"
          onClick={downloadTemplate}
          style={{
            padding: "9px 14px",
            background: "#E6F3EB",
            color: "#0F5D2C",
            border: "1px solid #C4E2CE",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
          hoverStyle={{ background: "#D8ECE0" }}
        >
          ↓ Unduh Template
        </HoverBox>
        <HoverBox
          as="button"
          onClick={() => fileRef.current?.click()}
          style={{ ...greenBtn, opacity: busy ? 0.7 : 1 }}
          hoverStyle={{ background: "#167C3C" }}
        >
          ↑ {busy ? "Memproses…" : "Unggah Excel"}
        </HoverBox>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
      </div>

      {file && <div style={{ fontSize: 12, color: "#6B776F", marginTop: 10 }}>File: {file.name}</div>}

      {message && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            background: message.startsWith("✓") ? "#E6F3EB" : "#FDECEC",
            color: message.startsWith("✓") ? "#0F5D2C" : "#C4363B",
          }}
        >
          {message}
        </div>
      )}

      {report && !report.ok && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: "#FDECEC",
            border: "1px solid #F3C7C7",
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "#C4363B", marginBottom: 8 }}>
            {report.errors.length} kesalahan — perbaiki lalu unggah ulang (tidak ada yang diimpor):
          </div>
          <div style={{ maxHeight: 220, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {report.errors.slice(0, 100).map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: "#7C2A2E", lineHeight: 1.45 }}>
                <b>
                  {e.sheet} · baris {e.row}
                  {e.column ? ` · ${e.column}` : ""}
                </b>{" "}
                — {e.message}
              </div>
            ))}
            {report.errors.length > 100 && (
              <div style={{ fontSize: 12, color: "#9AA69E" }}>
                …dan {report.errors.length - 100} kesalahan lain.
              </div>
            )}
          </div>
        </div>
      )}

      {report && report.ok && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: "#E6F3EB",
            border: "1px solid #C4E2CE",
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F5D2C", marginBottom: 6 }}>
            Semua valid — {report.totalDocs} baris siap diimpor
          </div>
          <div style={{ fontSize: 12.5, color: "#3A463F", marginBottom: 12 }}>
            {Object.entries(report.counts)
              .filter(([, n]) => n > 0)
              .map(([k, n]) => `${k}: ${n}`)
              .join(" · ") || "—"}
          </div>
          <HoverBox
            as="button"
            onClick={commit}
            style={{ ...greenBtn, opacity: busy ? 0.7 : 1 }}
            hoverStyle={{ background: "#167C3C" }}
          >
            {busy ? "Mengimpor…" : `Konfirmasi Impor (${report.totalDocs})`}
          </HoverBox>
        </div>
      )}
    </div>
  );
}
