"use client";

import type { Jadwal } from "@/lib/types";
import { Catalog } from "@/lib/catalog";
import { BATAS_SKS } from "@/lib/config";
import { fmtSks } from "@/lib/time";
import { rekapBadge } from "@/lib/ui";

export default function RekapBeban({
  catalog,
  jadwal,
}: {
  catalog: Catalog;
  jadwal: Jadwal[];
}) {
  const rekap = catalog.dosen
    .map((d) => {
      const entries = jadwal.filter((j) => j.dosenIds.includes(d.id));
      const total = entries.reduce((s, j) => s + j.sksEff, 0);
      return { d, entri: entries.length, total };
    })
    .sort((a, b) => b.total - a.total);

  const overCount = rekap.filter((r) => r.total > BATAS_SKS).length;

  const cols = "40px 2fr 1fr 1fr 1.4fr";

  return (
    <>
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <Stat label="Total dosen aktif" value={catalog.dosen.length} />
        <Stat label="Total entri jadwal" value={jadwal.length} />
        <Stat label={`Melebihi ${BATAS_SKS} SKS`} value={overCount} danger />
      </div>

      <div style={{ background: "#fff", border: "1px solid #E3E8E5", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "13px 18px",
            background: "#FAFBFA",
            borderBottom: "1px solid #E9EDEA",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#6B776F",
            letterSpacing: ".03em",
          }}
        >
          <div>#</div>
          <div>DOSEN</div>
          <div style={{ textAlign: "center" }}>ENTRI</div>
          <div style={{ textAlign: "center" }}>SKS EFEKTIF</div>
          <div style={{ textAlign: "right" }}>STATUS BEBAN</div>
        </div>
        {rekap.map((r, i) => {
          const over = r.total > BATAS_SKS;
          const near = r.total > 12 && r.total <= BATAS_SKS;
          return (
            <div
              key={r.d.id}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                padding: "13px 18px",
                borderBottom: "1px solid #F2F4F2",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <div style={{ color: "#9AA69E", fontWeight: 700 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{r.d.nama}</div>
                <div style={{ fontSize: 11, color: "#9AA69E" }}>NIDN {r.d.nidn}</div>
              </div>
              <div style={{ textAlign: "center", fontWeight: 600 }}>{r.entri}</div>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 800,
                  color: over ? "#C4363B" : near ? "#C77A00" : "#17251C",
                }}
              >
                {fmtSks(r.total)} SKS
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={rekapBadge(over ? "over" : near ? "near" : "ok")}>
                  {over ? "Melebihi batas" : near ? "Mendekati batas" : "Aman"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div
      style={{
        background: danger ? "#FDECEC" : "#fff",
        border: `1px solid ${danger ? "#F5CACA" : "#E3E8E5"}`,
        borderRadius: 12,
        padding: "16px 20px",
        flex: 1,
      }}
    >
      <div style={{ fontSize: 12, color: danger ? "#C4363B" : "#6B776F", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 2, color: danger ? "#C4363B" : "#17251C" }}>
        {value}
      </div>
    </div>
  );
}
