"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Catalog, prodiById } from "@/lib/catalog";
import { HoverBox } from "./primitives";
import { greenBtn } from "@/lib/ui";

type Tab = "dosen" | "ruangan" | "mk" | "kelas" | "prodi";

interface Cell {
  text: string | number;
  style?: CSSProperties;
}
interface Table {
  cols: string;
  headers: { label: string; align?: "left" | "center" | "right" }[];
  rows: Cell[][];
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

export default function MasterData({ catalog, isAdmin, firebaseMode, getToken }: Props) {
  const [tab, setTab] = useState<Tab>("dosen");
  const tabs: [Tab, string][] = [
    ["dosen", "Dosen"],
    ["ruangan", "Ruangan"],
    ["mk", "Mata Kuliah"],
    ["kelas", "Kelas"],
    ["prodi", "Prodi"],
  ];

  const table = buildTable(catalog, tab);

  return (
    <>
      {isAdmin && firebaseMode && <ImportPanel getToken={getToken} />}
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
          Impor Excel master data aktif saat terhubung Firebase.
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid #E3E8E5" }}>
        {tabs.map(([id, label]) => (
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

      <div style={{ fontSize: 13, color: "#6B776F", marginBottom: 14 }}>
        {table.rows.length} data ·{" "}
        {!isAdmin && (
          <span style={{ color: "#B0803A", fontWeight: 600 }}>
            Kelola master data hanya untuk Admin Fakultas
          </span>
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
            gridTemplateColumns: table.cols,
          }}
        >
          {table.headers.map((h, i) => (
            <div key={i} style={{ textAlign: h.align ?? "left" }}>
              {h.label}
            </div>
          ))}
        </div>
        {table.rows.map((cells, ri) => (
          <div
            key={ri}
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid #F2F4F2",
              fontSize: 13,
              display: "grid",
              alignItems: "center",
              gridTemplateColumns: table.cols,
            }}
          >
            {cells.map((c, ci) => (
              <div key={ci} style={{ fontWeight: 600, ...c.style }}>
                {c.text}
              </div>
            ))}
          </div>
        ))}
        {table.rows.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, color: "#9AA69E" }}>Belum ada data.</div>
        )}
      </div>
    </>
  );

  function buildTable(cat: Catalog, t: Tab): Table {
    const aktif = (on: boolean): CSSProperties => ({
      textAlign: "right",
      color: on ? "#1B8A43" : "#C4363B",
      fontWeight: 700,
    });
    if (t === "dosen")
      return {
        cols: "2.2fr 1.4fr 1fr",
        headers: [{ label: "NAMA" }, { label: "NIDN" }, { label: "STATUS", align: "right" }],
        rows: cat.dosen.map((d) => [
          { text: d.nama, style: strong },
          { text: d.nidn, style: muted },
          { text: d.aktif === false ? "Nonaktif" : "Aktif", style: aktif(d.aktif !== false) },
        ]),
      };
    if (t === "ruangan")
      return {
        cols: "1fr 1.6fr 1.4fr 1fr",
        headers: [{ label: "KODE" }, { label: "NAMA" }, { label: "GEDUNG" }, { label: "STATUS", align: "right" }],
        rows: cat.ruangan.map((r) => [
          { text: r.kode, style: strong },
          { text: r.nama },
          { text: r.gedung, style: muted },
          { text: r.aktif === false ? "Nonaktif" : "Aktif", style: aktif(r.aktif !== false) },
        ]),
      };
    if (t === "mk")
      return {
        cols: "1fr 2.4fr .8fr .8fr 1fr",
        headers: [
          { label: "KODE" },
          { label: "NAMA" },
          { label: "SKS", align: "center" },
          { label: "SEM", align: "center" },
          { label: "PRODI", align: "right" },
        ],
        rows: cat.mk.map((m) => [
          { text: m.kode, style: strong },
          { text: m.nama },
          { text: m.sks, style: { textAlign: "center", fontWeight: 700 } },
          { text: m.sem, style: { textAlign: "center", color: "#9AA69E" } },
          { text: prodiById(cat, m.prodiId)?.kode ?? m.prodiId, style: { textAlign: "right", color: "#5E6B62" } },
        ]),
      };
    if (t === "kelas")
      return {
        cols: "1.6fr 1fr 1fr 1fr",
        headers: [
          { label: "ROMBEL" },
          { label: "PRODI" },
          { label: "SEMESTER", align: "center" },
          { label: "STATUS", align: "right" },
        ],
        rows: cat.kelas.map((k) => [
          { text: k.nama, style: strong },
          { text: prodiById(cat, k.prodiId)?.kode ?? k.prodiId },
          { text: `Semester ${k.sem}`, style: { textAlign: "center", color: "#9AA69E" } },
          { text: k.aktif === false ? "Nonaktif" : "Aktif", style: aktif(k.aktif !== false) },
        ]),
      };
    return {
      cols: "1fr 2.6fr 1fr",
      headers: [{ label: "KODE" }, { label: "NAMA" }, { label: "JENJANG", align: "right" }],
      rows: cat.prodi.map((p) => [
        { text: p.kode, style: strong },
        { text: p.nama },
        { text: p.jenjang, style: { textAlign: "right", fontWeight: 700, color: "#5E6B62" } },
      ]),
    };
  }
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
