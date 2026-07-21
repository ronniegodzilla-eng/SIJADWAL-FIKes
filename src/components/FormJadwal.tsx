"use client";

import { useState, type CSSProperties } from "react";
import type { FormDraft, JadwalRaw, Jadwal } from "@/lib/types";
import { Catalog, mkById } from "@/lib/catalog";
import { DAYS, MENIT_PER_SKS } from "@/lib/config";
import { m2t, m2hhmm, hhmm2m } from "@/lib/time";
import { validate } from "@/lib/validation";
import { segStyle } from "@/lib/ui";
import { HoverBox } from "./primitives";
import { Combobox } from "./Combobox";
import { DosenPicker } from "./DosenPicker";

interface Props {
  catalog: Catalog;
  jadwal: Jadwal[];
  isAdmin: boolean;
  myProdi: string | null;
  editId: string | null;
  initialForm: FormDraft;
  userId: string;
  onSave: (entry: JadwalRaw) => void;
  onClose: () => void;
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#3A463F",
  marginBottom: 6,
};
const selStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #DDE4DF",
  borderRadius: 9,
  fontSize: 13,
  background: "#fff",
  cursor: "pointer",
};

export default function FormJadwal(p: Props) {
  const [form, setForm] = useState<FormDraft>(p.initialForm);
  const [overrideChecked, setOverrideChecked] = useState(false);

  const upd = (patch: Partial<FormDraft>) => {
    setForm((f) => ({ ...f, ...patch }));
    setOverrideChecked(false);
  };

  const mkSel = mkById(p.catalog, form.mataKuliahId);
  const val = validate(p.catalog, p.jadwal, form, p.editId);
  const hasWarning = val.warnings.length > 0;
  const valClean =
    val.complete && val.conflicts.length === 0 && val.warnings.length === 0;
  const blocked =
    val.conflicts.length > 0 ||
    (hasWarning && !overrideChecked) ||
    !val.complete;

  const mkOptions = p.catalog.mk
    .filter((m) => p.isAdmin || m.prodiId === p.myProdi)
    .map((m) => ({ value: m.id, label: `${m.kode} · ${m.nama} (${m.sks} SKS)` }));
  const kelasOptions = p.catalog.kelas
    .filter((k) => !mkSel || k.prodiId === mkSel.prodiId)
    .map((k) => ({ value: k.id, label: k.nama }));

  function save() {
    if (blocked) return;
    const overrides = val.warnings.map((w) => ({
      kode: w.kode,
      userId: p.userId,
      timestamp: Date.now(),
    }));
    const entry: JadwalRaw = {
      id: p.editId || `j${Date.now()}`,
      mkId: form.mataKuliahId,
      kelasId: form.kelasId,
      dosenIds: [...form.dosenIds],
      mode: form.mode,
      ruanganId: form.mode === "offline" ? form.ruanganId || null : null,
      hari: Number(form.hari),
      jamMulai: form.jamMulai,
      overrideWarnings: overrides,
    };
    p.onSave(entry);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,40,25,.42)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflow: "auto",
        animation: "sjOverlay .15s ease",
      }}
      onClick={p.onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,.28)",
          animation: "sjPanel .2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E9EDEA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: "-.01em" }}>
              {p.editId ? "Edit Jadwal" : "Tambah Jadwal Baru"}
            </div>
            <div style={{ fontSize: 12, color: "#6B776F" }}>
              Validasi bentrok berjalan otomatis saat field lengkap.
            </div>
          </div>
          <HoverBox
            onClick={p.onClose}
            style={{ cursor: "pointer", color: "#9AA69E", display: "flex" }}
            hoverStyle={{ color: "#17251C" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </HoverBox>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px" }}>
          {/* Field kiri */}
          <div
            style={{
              padding: "22px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 15,
              borderRight: "1px solid #EEF1EF",
            }}
          >
            <div>
              <label style={labelStyle}>Mata kuliah</label>
              <Combobox
                value={form.mataKuliahId}
                options={mkOptions}
                onChange={(v) => upd({ mataKuliahId: v, kelasId: "" })}
                placeholder="— pilih mata kuliah —"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Kelas / rombel</label>
                <Combobox
                  value={form.kelasId}
                  options={kelasOptions}
                  onChange={(v) => upd({ kelasId: v })}
                  placeholder="— pilih kelas —"
                />
              </div>
              <div>
                <label style={labelStyle}>Hari</label>
                <select
                  value={form.hari}
                  onChange={(e) => upd({ hari: Number(e.target.value) })}
                  style={selStyle}
                >
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {DAYS[d]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Dosen{" "}
                <span style={{ color: "#9AA69E", fontWeight: 500 }}>
                  (klik “+ Tambah dosen” untuk team teaching)
                </span>
              </label>
              <DosenPicker
                dosen={p.catalog.dosen}
                selectedIds={form.dosenIds}
                onChange={(ids) => upd({ dosenIds: ids })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Mode</label>
                <div style={{ display: "flex", background: "#F1F4F2", borderRadius: 9, padding: 3 }}>
                  <div onClick={() => upd({ mode: "offline" })} style={segStyle(form.mode === "offline")}>
                    Offline
                  </div>
                  <div
                    onClick={() => upd({ mode: "online", ruanganId: "" })}
                    style={segStyle(form.mode === "online")}
                  >
                    Online
                  </div>
                </div>
              </div>
              {form.mode === "offline" ? (
                <div>
                  <label style={labelStyle}>Ruangan</label>
                  <Combobox
                    value={form.ruanganId}
                    options={p.catalog.ruangan.map((r) => ({
                      value: r.id,
                      label: `${r.kode} — ${r.gedung}`,
                    }))}
                    onChange={(v) => upd({ ruanganId: v })}
                    placeholder="— pilih ruangan —"
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#6B776F",
                      background: "#F1F4F2",
                      padding: "9px 12px",
                      borderRadius: 8,
                      width: "100%",
                    }}
                  >
                    Mode online — ruangan tidak diperlukan.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Jam mulai</label>
                <input
                  type="time"
                  value={m2hhmm(form.jamMulai)}
                  onChange={(e) => e.target.value && upd({ jamMulai: hhmm2m(e.target.value) })}
                  style={{ ...selStyle, cursor: "text" }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Jam selesai <span style={{ color: "#9AA69E", fontWeight: 500 }}>(otomatis)</span>
                </label>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#F1F4F2",
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#3A463F",
                  }}
                >
                  {mkSel ? m2t(form.jamMulai + mkSel.sks * MENIT_PER_SKS) : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Panel validasi */}
          <div
            style={{
              padding: "22px 20px",
              background: "#FAFBFA",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#6B776F",
                letterSpacing: ".04em",
                marginBottom: 12,
              }}
            >
              HASIL VALIDASI
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
              {valClean && (
                <div
                  style={{
                    padding: 13,
                    background: "#E6F3EB",
                    border: "1px solid #C4E2CE",
                    borderRadius: 10,
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B8A43" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <div style={{ fontSize: 12.5, color: "#0F5D2C", fontWeight: 600, lineHeight: 1.45 }}>
                    Tidak ada bentrok. Jadwal aman disimpan.
                  </div>
                </div>
              )}
              {!val.complete && (
                <div style={{ fontSize: 12.5, color: "#A6B0A9", lineHeight: 1.5, padding: "6px 2px" }}>
                  Lengkapi mata kuliah, dosen, hari &amp; jam mulai untuk menjalankan
                  validasi.
                </div>
              )}
              {val.conflicts.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: "#FDECEC",
                    border: "1px solid #F3C7C7",
                    borderLeft: "3px solid #D64545",
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#C4363B",
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ background: "#D64545", color: "#fff", padding: "1px 6px", borderRadius: 5 }}>
                      {c.kode}
                    </span>
                    {c.judul}
                  </div>
                  <div style={{ fontSize: 12, color: "#7C2A2E", lineHeight: 1.5 }}>{c.detail}</div>
                </div>
              ))}
              {val.warnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: "#FBF3E0",
                    border: "1px solid #ECDCB0",
                    borderLeft: "3px solid #E0A100",
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#A87400",
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ background: "#E0A100", color: "#fff", padding: "1px 6px", borderRadius: 5 }}>
                      {w.kode}
                    </span>
                    {w.judul}
                  </div>
                  <div style={{ fontSize: 12, color: "#7A5B12", lineHeight: 1.5 }}>{w.detail}</div>
                </div>
              ))}
              {hasWarning && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11.5,
                    color: "#7A5B12",
                    marginTop: 2,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={overrideChecked}
                    onChange={() => setOverrideChecked((v) => !v)}
                    style={{ width: 15, height: 15, accentColor: "#E0A100" }}
                  />
                  Simpan tetap &amp; catat override
                </label>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <button
                onClick={save}
                disabled={blocked}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "none",
                  borderRadius: 9,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: blocked ? "not-allowed" : "pointer",
                  background: blocked ? "#D5DBD7" : "#1B8A43",
                  color: blocked ? "#8A968E" : "#fff",
                  boxShadow: blocked ? "none" : "0 2px 6px rgba(27,138,67,.28)",
                }}
              >
                {val.conflicts.length > 0
                  ? "Tidak dapat disimpan — ada bentrok"
                  : p.editId
                  ? "Simpan Perubahan"
                  : "Simpan Jadwal"}
              </button>
              <HoverBox
                as="button"
                onClick={p.onClose}
                style={{
                  width: "100%",
                  padding: 11,
                  background: "#fff",
                  color: "#5E6B62",
                  border: "1px solid #DDE4DF",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                hoverStyle={{ background: "#F1F4F2" }}
              >
                Batal
              </HoverBox>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
