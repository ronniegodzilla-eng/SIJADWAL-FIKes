"use client";

import Image from "next/image";
import type { Jadwal, Periode } from "@/lib/types";
import { Catalog } from "@/lib/catalog";
import { exportJadwal, type ExportKind, type ExportFormat } from "@/lib/exporter";
import { HoverBox } from "./primitives";

const TANGGAL_CETAK = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const cards: { kind: ExportKind; title: string; desc: string; icon: string; bg: string; color: string }[] = [
  {
    kind: "prodi",
    title: "Jadwal per Prodi",
    desc: "Tabel jadwal mingguan tiap program studi, dikelompokkan per hari.",
    icon: "🏫",
    bg: "#E4F6EE",
    color: "#0E9F6E",
  },
  {
    kind: "dosen",
    title: "Jadwal per Dosen",
    desc: "Jadwal mengajar tiap dosen beserta rekap total SKS efektif.",
    icon: "👤",
    bg: "#E7EFFB",
    color: "#2A6FD6",
  },
  {
    kind: "ruangan",
    title: "Jadwal per Ruangan",
    desc: "Pemakaian tiap ruangan sepanjang minggu untuk cek okupansi.",
    icon: "🚪",
    bg: "#F3E9FA",
    color: "#8A3FB8",
  },
];

export default function Ekspor({
  catalog,
  jadwal,
  periodeAktif,
}: {
  catalog: Catalog;
  jadwal: Jadwal[];
  periodeAktif: Periode;
}) {
  const run = (kind: ExportKind, format: ExportFormat) =>
    exportJadwal(catalog, jadwal, kind, format, periodeAktif.nama, TANGGAL_CETAK);

  return (
    <div style={{ maxWidth: 820 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #E3E8E5",
          borderRadius: 14,
          padding: 20,
          marginBottom: 18,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Image src="/logo-uis.png" alt="UIS" width={52} height={52} style={{ objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            Fakultas Ilmu Kesehatan · Universitas Ibnu Sina
          </div>
          <div style={{ fontSize: 12.5, color: "#6B776F" }}>
            Periode {periodeAktif.nama} · Dicetak {TANGGAL_CETAK}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B776F", letterSpacing: ".04em", marginBottom: 12 }}>
        PILIH JENIS EKSPOR
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {cards.map((c) => (
          <HoverBox
            key={c.kind}
            style={{
              background: "#fff",
              border: "1px solid #E3E8E5",
              borderRadius: 14,
              padding: 18,
            }}
            hoverStyle={{ border: "1px solid #1B8A43", boxShadow: "0 4px 14px rgba(27,138,67,.1)" }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
                background: c.bg,
                color: c.color,
                fontSize: 20,
              }}
            >
              {c.icon}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "#6B776F", lineHeight: 1.45, marginBottom: 14 }}>
              {c.desc}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <HoverBox
                onClick={() => run(c.kind, "pdf")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: 8,
                  background: "#FDECEC",
                  color: "#C4363B",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                hoverStyle={{ background: "#FBDDDD" }}
              >
                PDF
              </HoverBox>
              <HoverBox
                onClick={() => run(c.kind, "excel")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: 8,
                  background: "#E6F3EB",
                  color: "#0F5D2C",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                hoverStyle={{ background: "#D8ECE0" }}
              >
                Excel
              </HoverBox>
            </div>
          </HoverBox>
        ))}
      </div>
    </div>
  );
}
