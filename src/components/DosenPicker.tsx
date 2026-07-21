"use client";

import { useState } from "react";
import { Combobox } from "./Combobox";
import { HoverBox } from "./primitives";

interface D {
  id: string;
  nama: string;
}

/**
 * Pilih dosen lewat dropdown. Team teaching: satu dropdown per dosen +
 * tombol "Tambah dosen" untuk memunculkan dropdown baru. Tiap baris bisa dihapus.
 */
export function DosenPicker({
  dosen,
  selectedIds,
  onChange,
}: {
  dosen: D[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);

  // Opsi: dosen yang belum dipilih (kecuali yang sedang di baris ini).
  const opts = (keepId?: string) =>
    dosen
      .filter((d) => !selectedIds.includes(d.id) || d.id === keepId)
      .map((d) => ({ value: d.id, label: d.nama }));

  const setAt = (idx: number, val: string) => {
    const next = [...selectedIds];
    if (!val) next.splice(idx, 1);
    else next[idx] = val;
    onChange(next);
  };
  const removeAt = (idx: number) => {
    const next = [...selectedIds];
    next.splice(idx, 1);
    onChange(next);
  };
  const addNew = (val: string) => {
    if (val) onChange([...selectedIds, val]);
    setAdding(false);
  };

  const showEmpty = adding || selectedIds.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {selectedIds.map((id, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Combobox
            value={id}
            options={opts(id)}
            onChange={(v) => setAt(idx, v)}
            placeholder="— pilih dosen —"
            style={{ flex: 1 }}
          />
          <RemoveBtn onClick={() => removeAt(idx)} />
        </div>
      ))}

      {showEmpty && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Combobox
            value=""
            options={opts()}
            onChange={addNew}
            placeholder="— pilih dosen —"
            style={{ flex: 1 }}
          />
          {selectedIds.length > 0 && <RemoveBtn onClick={() => setAdding(false)} />}
        </div>
      )}

      {!showEmpty && (
        <HoverBox
          as="button"
          onClick={() => setAdding(true)}
          style={{
            alignSelf: "flex-start",
            padding: "7px 12px",
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
          + Tambah dosen
        </HoverBox>
      )}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Hapus dosen"
      style={{
        flexShrink: 0,
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FDECEC",
        color: "#C4363B",
        border: "1px solid #F5CACA",
        borderRadius: 8,
        fontSize: 18,
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      ×
    </button>
  );
}
