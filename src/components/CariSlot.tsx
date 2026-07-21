"use client";

import { useState, type CSSProperties } from "react";
import type { Jadwal, FormDraft } from "@/lib/types";
import { Catalog, mkById } from "@/lib/catalog";
import { MENIT_PER_SKS } from "@/lib/config";
import { cariSlot, type SlotResult } from "@/lib/slot";
import { chipStyle } from "@/lib/ui";
import { HoverBox } from "./primitives";

interface Props {
  catalog: Catalog;
  jadwal: Jadwal[];
  onUseSlot: (form: FormDraft) => void;
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#3A463F",
  marginBottom: 7,
};
const selStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #DDE4DF",
  borderRadius: 9,
  fontSize: 13,
  background: "#fff",
  cursor: "pointer",
  marginBottom: 16,
};
const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #E3E8E5",
  borderRadius: 14,
  padding: 20,
};

export default function CariSlot({ catalog, jadwal, onUseSlot }: Props) {
  const [mataKuliahId, setMk] = useState("");
  const [kelasId, setKelas] = useState("");
  const [dosenIds, setDosenIds] = useState<string[]>([]);
  const [result, setResult] = useState<SlotResult | null>(null);

  const mkSel = mkById(catalog, mataKuliahId);
  const kelasOptions = catalog.kelas.filter((k) => !mkSel || k.prodiId === mkSel.prodiId);

  function run() {
    setResult(
      cariSlot(catalog, jadwal, { mataKuliahId, kelasId, dosenIds, mode: "offline", ruanganId: "" })
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>Parameter Pencarian</div>
        <div style={{ fontSize: 12, color: "#6B776F", marginBottom: 18 }}>
          Slot lolos aturan bentrok dosen, kelas &amp; ruangan (C1–C3).
        </div>

        <label style={labelStyle}>Mata kuliah</label>
        <select
          value={mataKuliahId}
          onChange={(e) => {
            setMk(e.target.value);
            setKelas("");
            setResult(null);
          }}
          style={selStyle}
        >
          <option value="">— pilih mata kuliah —</option>
          {catalog.mk.map((m) => (
            <option key={m.id} value={m.id}>
              {m.kode} · {m.nama} ({m.sks} SKS)
            </option>
          ))}
        </select>

        <label style={labelStyle}>Kelas / rombel</label>
        <select
          value={kelasId}
          onChange={(e) => {
            setKelas(e.target.value);
            setResult(null);
          }}
          style={selStyle}
        >
          <option value="">— pilih kelas —</option>
          {kelasOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Dosen (bisa lebih dari satu)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {catalog.dosen.map((d) => {
            const on = dosenIds.includes(d.id);
            return (
              <div
                key={d.id}
                onClick={() => {
                  setDosenIds((ids) =>
                    on ? ids.filter((x) => x !== d.id) : [...ids, d.id]
                  );
                  setResult(null);
                }}
                style={chipStyle(on)}
              >
                {d.nama.split(",")[0]}
              </div>
            );
          })}
        </div>

        <label style={labelStyle}>Durasi</label>
        <div
          style={{
            padding: "10px 12px",
            background: "#F1F4F2",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            color: "#3A463F",
            marginBottom: 18,
          }}
        >
          {mkSel ? `${mkSel.sks * MENIT_PER_SKS} menit (${mkSel.sks} SKS)` : "pilih mata kuliah dulu"}
        </div>

        <HoverBox
          as="button"
          onClick={run}
          style={{
            width: "100%",
            padding: 12,
            background: "#1B8A43",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(27,138,67,.25)",
          }}
          hoverStyle={{ background: "#167C3C" }}
        >
          Cari Slot Kosong
        </HoverBox>
      </div>

      <div style={{ ...cardStyle, minHeight: 300 }}>
        {!result ? (
          <div
            style={{
              height: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#A6B0A9",
              textAlign: "center",
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600 }}>
              Isi parameter lalu tekan “Cari Slot Kosong”.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>Slot tersedia</div>
            <div style={{ fontSize: 12, color: "#6B776F", marginBottom: 16 }}>{result.summary}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {result.rows.map((row) => (
                <div key={row.hari}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#3A463F", marginBottom: 7 }}>
                    {row.day}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {row.slots.map((s) => (
                      <HoverBox
                        key={s.start}
                        onClick={() =>
                          onUseSlot({
                            mataKuliahId,
                            kelasId,
                            dosenIds: [...dosenIds],
                            mode: "offline",
                            ruanganId: "",
                            hari: row.hari,
                            jamMulai: s.start,
                          })
                        }
                        style={{
                          padding: "8px 13px",
                          background: "#E6F3EB",
                          border: "1px solid #C4E2CE",
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#0F5D2C",
                          cursor: "pointer",
                        }}
                        hoverStyle={{ background: "#D8ECE0" }}
                      >
                        {s.label}
                      </HoverBox>
                    ))}
                    {row.empty && (
                      <div style={{ fontSize: 12, color: "#B0B9B2", fontStyle: "italic" }}>
                        tidak ada slot
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
