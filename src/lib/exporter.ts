import type { Jadwal } from "./types";
import {
  Catalog,
  mkById,
  kelasById,
  ruanganById,
  prodiById,
  dosenShort,
} from "./catalog";
import { DAYS } from "./config";
import { m2t, fmtSks } from "./time";

export type ExportKind = "prodi" | "dosen" | "ruangan";
export type ExportFormat = "pdf" | "excel";

interface Section {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: string;
}

const escapeHtml = (s: string | number) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function jadwalRows(cat: Catalog, entries: Jadwal[]) {
  return entries
    .slice()
    .sort((a, b) => a.hari - b.hari || a.jamMulai - b.jamMulai)
    .map((e) => {
      const mk = mkById(cat, e.mkId);
      const room =
        e.mode === "online" ? "ONLINE" : ruanganById(cat, e.ruanganId)?.kode ?? "-";
      return [
        DAYS[e.hari],
        `${m2t(e.jamMulai)}–${m2t(e.jamSelesai)}`,
        mk?.kode ?? "",
        mk?.nama ?? "",
        kelasById(cat, e.kelasId)?.nama ?? "",
        e.dosenIds.map((id) => dosenShort(cat, id)).join(", "),
        room,
      ];
    });
}

const JADWAL_HEADERS = [
  "Hari",
  "Waktu",
  "Kode",
  "Mata Kuliah",
  "Kelas",
  "Dosen",
  "Ruang",
];

/** Bangun daftar section untuk satu jenis ekspor. */
function buildSections(
  cat: Catalog,
  jadwal: Jadwal[],
  kind: ExportKind
): Section[] {
  if (kind === "prodi") {
    return cat.prodi.map((p) => ({
      title: `${p.kode} — ${p.nama}`,
      headers: JADWAL_HEADERS,
      rows: jadwalRows(
        cat,
        jadwal.filter((j) => j.prodiId === p.id)
      ),
    }));
  }
  if (kind === "dosen") {
    return cat.dosen.map((d) => {
      const entries = jadwal.filter((j) => j.dosenIds.includes(d.id));
      const totalSks = entries.reduce((s, j) => s + j.sksEff, 0);
      return {
        title: `${d.nama} · NIDN ${d.nidn}`,
        headers: JADWAL_HEADERS,
        rows: jadwalRows(cat, entries),
        footer: `Total SKS efektif: ${fmtSks(totalSks)}`,
      };
    });
  }
  return cat.ruangan.map((r) => ({
    title: `${r.kode} — ${r.nama} (${r.gedung})`,
    headers: JADWAL_HEADERS,
    rows: jadwalRows(
      cat,
      jadwal.filter((j) => j.mode === "offline" && j.ruanganId === r.id)
    ),
  }));
}

const KIND_LABEL: Record<ExportKind, string> = {
  prodi: "Jadwal per Prodi",
  dosen: "Jadwal per Dosen",
  ruangan: "Jadwal per Ruangan",
};

function documentHtml(
  sections: Section[],
  title: string,
  periodeNama: string,
  tanggalCetak: string
): string {
  const body = sections
    .map((sec) => {
      const head = sec.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
      const rows = sec.rows.length
        ? sec.rows
            .map(
              (r) =>
                `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
            )
            .join("")
        : `<tr><td colspan="${sec.headers.length}" style="color:#999;font-style:italic">Tidak ada jadwal</td></tr>`;
      const footer = sec.footer
        ? `<div class="sec-footer">${escapeHtml(sec.footer)}</div>`
        : "";
      return `<h2>${escapeHtml(sec.title)}</h2>
        <table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>${footer}`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title>
  <style>
    body{font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#17251c;padding:28px;}
    .doc-head{border-bottom:2px solid #0f5d2c;padding-bottom:12px;margin-bottom:18px;}
    .doc-head h1{margin:0;font-size:18px;color:#0f5d2c;}
    .doc-head .meta{font-size:12px;color:#6b776f;margin-top:4px;}
    h2{font-size:14px;margin:22px 0 8px;color:#17251c;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th,td{border:1px solid #d8ded9;padding:6px 9px;text-align:left;}
    th{background:#e6f3eb;color:#0f5d2c;font-weight:700;}
    .sec-footer{font-size:12px;font-weight:700;margin:6px 0 0;color:#0f5d2c;}
    @media print{body{padding:0;}}
  </style></head>
  <body>
    <div class="doc-head">
      <h1>Fakultas Ilmu Kesehatan · Universitas Ibnu Sina</h1>
      <div class="meta">${escapeHtml(title)} · Periode ${escapeHtml(
    periodeNama
  )} · Dicetak ${escapeHtml(tanggalCetak)}</div>
    </div>
    ${body}
  </body></html>`;
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Ekspor jadwal ke PDF (print dialog) atau Excel (.xls). */
export function exportJadwal(
  cat: Catalog,
  jadwal: Jadwal[],
  kind: ExportKind,
  format: ExportFormat,
  periodeNama: string,
  tanggalCetak: string
) {
  const title = KIND_LABEL[kind];
  const sections = buildSections(cat, jadwal, kind);
  const html = documentHtml(sections, title, periodeNama, tanggalCetak);
  const slug = `sijadwal-${kind}-${periodeNama.replace(/[^\w]+/g, "-")}`;

  if (format === "excel") {
    // Excel membuka HTML table sebagai worksheet.
    triggerDownload(html, `${slug}.xls`, "application/vnd.ms-excel");
    return;
  }

  // PDF → jendela cetak.
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Izinkan popup untuk mencetak PDF.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
