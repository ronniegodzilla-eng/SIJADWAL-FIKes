"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface ComboOption {
  value: string;
  label: string;
}

/**
 * Dropdown yang bisa diketik untuk mencari (searchable select).
 * Menampilkan label opsi terpilih saat tertutup; mengetik memfilter daftar.
 */
export function Combobox({
  value,
  options,
  onChange,
  placeholder = "— pilih —",
  style,
  disabled,
}: {
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <input
        value={open ? query : selected?.label ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && open && filtered.length) {
            e.preventDefault();
            onChange(filtered[0].value);
            setOpen(false);
            setQuery("");
          }
        }}
        style={{
          width: "100%",
          padding: "10px 30px 10px 12px",
          border: "1px solid #DDE4DF",
          borderRadius: 9,
          fontSize: 13,
          background: disabled ? "#F1F4F2" : "#fff",
          cursor: disabled ? "not-allowed" : "text",
          outline: "none",
          color: "#17251C",
        }}
      />
      <span
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled) setOpen((o) => !o);
        }}
        style={{
          position: "absolute",
          right: 11,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 10,
          color: "#9AA69E",
          pointerEvents: disabled ? "none" : "auto",
          cursor: "pointer",
        }}
      >
        ▾
      </span>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 80,
            background: "#fff",
            border: "1px solid #DDE4DF",
            borderRadius: 9,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            maxHeight: 220,
            overflow: "auto",
            padding: 4,
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "9px 10px", fontSize: 12.5, color: "#9AA69E" }}>
              Tidak ada hasil
            </div>
          )}
          {filtered.map((o) => (
            <div
              key={o.value}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o.value);
                setOpen(false);
                setQuery("");
              }}
              style={{
                padding: "9px 10px",
                fontSize: 13,
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: o.value === value ? 700 : 500,
                background: o.value === value ? "#E6F3EB" : "transparent",
                color: o.value === value ? "#0F5D2C" : "#17251C",
              }}
              onMouseEnter={(e) => {
                if (o.value !== value) e.currentTarget.style.background = "#F1F4F2";
              }}
              onMouseLeave={(e) => {
                if (o.value !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
