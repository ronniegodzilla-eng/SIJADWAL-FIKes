"use client";

import type { CSSProperties } from "react";
import type { Jadwal } from "@/lib/types";
import {
  Catalog,
  mkById,
  kelasById,
  ruanganById,
  prodiById,
  dosenById,
  dosenGridLabel,
} from "@/lib/catalog";
import {
  DAYS,
  JAM_MULAI_OPERASIONAL as START,
  JAM_SELESAI_OPERASIONAL as END,
  PX_PER_MENIT as PX,
} from "@/lib/config";
import { m2t } from "@/lib/time";
import { HoverBox } from "./primitives";
import { Combobox } from "./Combobox";
import { card, greenBtn } from "@/lib/ui";

type ViewMode = "prodi" | "dosen" | "ruangan" | "kelas";

interface Props {
  catalog: Catalog;
  jadwal: Jadwal[];
  viewMode: ViewMode;
  filterValue: string;
  selectedId: string | null;
  canEdit: (e: Jadwal) => boolean;
  onSetViewMode: (v: ViewMode) => void;
  onSetFilter: (value: string) => void;
  onSelect: (id: string | null) => void;
  onOpenNewForm: () => void;
  onEdit: (e: Jadwal) => void;
  onDelete: (id: string) => void;
  /** Periode non-aktif: sembunyikan aksi tambah/edit (read-only). */
  readOnly?: boolean;
}

export default function GridMingguan(p: Props) {
  const { catalog, jadwal, viewMode, filterValue } = p;

  const filtered = jadwal.filter((j) => {
    if (viewMode === "prodi") return j.prodiId === filterValue;
    if (viewMode === "dosen") return j.dosenIds.includes(filterValue);
    if (viewMode === "ruangan") return j.ruanganId === filterValue;
    return j.kelasId === filterValue;
  });

  const gridHeight = (END - START) * PX;
  const hourLines = `repeating-linear-gradient(to bottom, transparent 0, transparent ${
    60 * PX - 1
  }px, #EEF1EF ${60 * PX - 1}px, #EEF1EF ${60 * PX}px)`;

  const viewDefs: [ViewMode, string][] = [
    ["prodi", "Per Prodi"],
    ["dosen", "Per Dosen"],
    ["ruangan", "Per Ruangan"],
    ["kelas", "Per Kelas"],
  ];
  const flabels: Record<ViewMode, string> = {
    prodi: "Prodi",
    dosen: "Dosen",
    ruangan: "Ruangan",
    kelas: "Kelas",
  };

  let fopts: { value: string; label: string }[] = [];
  if (viewMode === "prodi")
    fopts = catalog.prodi.map((x) => ({ value: x.id, label: `${x.kode} — ${x.nama}` }));
  else if (viewMode === "dosen")
    fopts = catalog.dosen.map((x) => ({ value: x.id, label: x.nama }));
  else if (viewMode === "ruangan")
    fopts = catalog.ruangan.map((x) => ({ value: x.id, label: `${x.kode} — ${x.gedung}` }));
  else fopts = catalog.kelas.map((x) => ({ value: x.id, label: x.nama }));

  const timeLabels = [];
  for (let h = 7; h <= 21; h++) {
    timeLabels.push({
      label: `${String(h).padStart(2, "0")}.00`,
      top: (h * 60 - START) * PX,
    });
  }

  const sel = p.selectedId ? jadwal.find((j) => j.id === p.selectedId) : null;

  return (
    <>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", ...card, borderRadius: 10, padding: 4 }}>
          {viewDefs.map(([id, label]) => (
            <div
              key={id}
              onClick={() => p.onSetViewMode(id)}
              style={{
                padding: "8px 15px",
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                color: viewMode === id ? "#0F5D2C" : "#7A867E",
                background: viewMode === id ? "#E6F3EB" : "transparent",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: "#6B776F", fontWeight: 600 }}>
            {flabels[viewMode]}
          </span>
          <Combobox
            value={filterValue}
            options={fopts}
            onChange={(v) => p.onSetFilter(v)}
            style={{ minWidth: 240 }}
            placeholder={`— pilih ${flabels[viewMode].toLowerCase()} —`}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 11.5,
            color: "#6B776F",
          }}
        >
          {catalog.prodi.map((pr) => (
            <div key={pr.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ width: 11, height: 11, borderRadius: 3, background: pr.color }}
              />
              {pr.kode}
            </div>
          ))}
        </div>
        {p.readOnly ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 13px",
              background: "#FBF3E0",
              border: "1px solid #ECDCB0",
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 700,
              color: "#A87400",
            }}
          >
            Periode non-aktif · read-only
          </div>
        ) : (
          <HoverBox
            as="button"
            onClick={p.onOpenNewForm}
            style={greenBtn}
            hoverStyle={{ background: "#167C3C" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Jadwal
          </HoverBox>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, ...card, overflow: "hidden" }}>
          {/* Header hari */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "58px repeat(6, 1fr)",
              borderBottom: "1px solid #E9EDEA",
              background: "#FAFBFA",
            }}
          >
            <div />
            {[1, 2, 3, 4, 5, 6].map((d) => {
              const count = filtered.filter((e) => e.hari === d).length;
              return (
                <div
                  key={d}
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#3A463F",
                    borderLeft: "1px solid #EEF1EF",
                  }}
                >
                  {DAYS[d]}
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "#9AA69E", marginTop: 1 }}>
                    {count} sesi
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div style={{ maxHeight: 620, overflow: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "58px repeat(6, 1fr)",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", height: gridHeight }}>
                {timeLabels.map((t) => (
                  <div
                    key={t.label}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: t.top,
                      fontSize: 10.5,
                      color: "#9AA69E",
                      fontWeight: 600,
                      transform: "translateY(-6px)",
                    }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <div
                  key={d}
                  style={{
                    position: "relative",
                    borderLeft: "1px solid #EEF1EF",
                    height: gridHeight,
                    backgroundImage: hourLines,
                  }}
                >
                  {filtered
                    .filter((e) => e.hari === d)
                    .map((e) => {
                      const pr = prodiById(catalog, e.prodiId)!;
                      const mk = mkById(catalog, e.mkId);
                      const top = (e.jamMulai - START) * PX;
                      const h = (e.jamSelesai - e.jamMulai) * PX;
                      const room =
                        e.mode === "online"
                          ? "ONLINE"
                          : ruanganById(catalog, e.ruanganId)?.kode;
                      const blockStyle: CSSProperties = {
                        position: "absolute",
                        left: 3,
                        right: 3,
                        top,
                        height: Math.max(h - 3, 34),
                        background: pr.bg,
                        borderLeft: `3px solid ${pr.color}`,
                        borderRadius: 7,
                        padding: "5px 7px",
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,.06)",
                      };
                      return (
                        <div key={e.id} onClick={() => p.onSelect(e.id)} style={blockStyle}>
                          <div style={ellipsis(11, 800, "#17251C")}>{mk?.kode}</div>
                          <div style={ellipsis(10, 600, "#3A463F")}>
                            {kelasById(catalog, e.kelasId)?.nama}
                          </div>
                          <div style={ellipsis(9.5, 400, "#5E6B62")}>
                            {e.dosenIds.map((id) => dosenGridLabel(catalog, id)).join(", ")}
                          </div>
                          <div
                            style={{
                              fontSize: 9.5,
                              fontWeight: 600,
                              marginTop: 1,
                              color: e.mode === "online" ? "#8A3FB8" : "#5E6B62",
                            }}
                          >
                            {room}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel detail */}
        {sel && (
          <DetailPanel
            catalog={catalog}
            sel={sel}
            canEdit={p.canEdit(sel)}
            periodeReadOnly={!!p.readOnly}
            onClose={() => p.onSelect(null)}
            onEdit={() => p.onEdit(sel)}
            onDelete={() => p.onDelete(sel.id)}
          />
        )}
      </div>
    </>
  );
}

function ellipsis(size: number, weight: number, color: string): CSSProperties {
  return {
    fontSize: size,
    fontWeight: weight,
    color,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

function DetailPanel({
  catalog,
  sel,
  canEdit,
  periodeReadOnly,
  onClose,
  onEdit,
  onDelete,
}: {
  catalog: Catalog;
  sel: Jadwal;
  canEdit: boolean;
  periodeReadOnly: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pr = prodiById(catalog, sel.prodiId)!;
  const mk = mkById(catalog, sel.mkId);
  const r = ruanganById(catalog, sel.ruanganId);
  const room = sel.mode === "online" ? "—" : r ? `${r.nama} · ${r.gedung}` : "—";

  const rows: [string, string][] = [
    ["Kelas", kelasById(catalog, sel.kelasId)?.nama ?? ""],
    ["Dosen", sel.dosenIds.map((id) => dosenById(catalog, id)?.nama).join(", ")],
    ["Waktu", `${DAYS[sel.hari]}, ${m2t(sel.jamMulai)}–${m2t(sel.jamSelesai)}`],
    ["Mode", sel.mode === "online" ? "Online" : "Offline (tatap muka)"],
    ["Ruang", room],
  ];

  return (
    <div
      style={{
        width: 296,
        flexShrink: 0,
        ...card,
        padding: 18,
        animation: "sjDrawer .18s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: pr.bg,
            color: pr.color,
          }}
        >
          {pr.kode}
        </div>
        <HoverBox
          onClick={onClose}
          style={{ cursor: "pointer", color: "#9AA69E", display: "flex" }}
          hoverStyle={{ color: "#17251C" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </HoverBox>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.01em", marginBottom: 2 }}>
        {mk?.nama}
      </div>
      <div style={{ fontSize: 12, color: "#6B776F", marginBottom: 16 }}>
        {mk?.kode} · {mk?.sks} SKS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 13 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 10 }}>
            <span
              style={{
                color: "#9AA69E",
                width: 68,
                flexShrink: 0,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {k}
            </span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {canEdit ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid #EEF1EF",
          }}
        >
          <HoverBox
            as="button"
            onClick={onEdit}
            style={{
              flex: 1,
              padding: 9,
              background: "#E6F3EB",
              color: "#0F5D2C",
              border: "1px solid #C4E2CE",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
            hoverStyle={{ background: "#D8ECE0" }}
          >
            Edit
          </HoverBox>
          <HoverBox
            as="button"
            onClick={onDelete}
            style={{
              flex: 1,
              padding: 9,
              background: "#FDECEC",
              color: "#C4363B",
              border: "1px solid #F5CACA",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
            hoverStyle={{ background: "#FBDDDD" }}
          >
            Hapus
          </HoverBox>
        </div>
      ) : (
        <div
          style={{
            marginTop: 18,
            padding: "10px 12px",
            background: "#F7F4E9",
            border: "1px solid #ECE2C4",
            borderRadius: 8,
            fontSize: 11.5,
            color: "#8A6D1E",
            lineHeight: 1.45,
          }}
        >
          {periodeReadOnly
            ? "Read-only — periode non-aktif. Jadwal periode lama hanya dapat dilihat & diekspor."
            : "Read-only — entri milik prodi lain. Anda dapat melihat okupansi tetapi tidak mengubahnya."}
        </div>
      )}
    </div>
  );
}
