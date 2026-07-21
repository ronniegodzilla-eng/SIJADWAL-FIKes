import type { CSSProperties } from "react";

// ── Style helper bersama (dipadankan dari prototipe Claude Design) ───

export const inputFocusRing =
  "0 0 0 3px rgba(27,138,67,.12)";

export function chipStyle(on: boolean): CSSProperties {
  return {
    padding: "6px 11px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: `1.5px solid ${on ? "#1B8A43" : "#DDE4DF"}`,
    background: on ? "#E6F3EB" : "#fff",
    color: on ? "#0F5D2C" : "#5E6B62",
    userSelect: "none",
  };
}

export function segStyle(on: boolean): CSSProperties {
  return {
    flex: 1,
    textAlign: "center",
    padding: 7,
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    color: on ? "#0F5D2C" : "#8A968E",
    background: on ? "#fff" : "transparent",
    boxShadow: on ? "0 1px 2px rgba(0,0,0,.08)" : "none",
  };
}

export function navStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "10px 12px",
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: active ? 700 : 600,
    color: active ? "#fff" : "#B5D3BE",
    background: active ? "rgba(246,201,21,.16)" : "transparent",
    borderLeft: active ? "3px solid #F6C915" : "3px solid transparent",
    paddingLeft: active ? 9 : 12,
    transition: "background .12s",
  };
}

export function roleBtn(active: boolean): CSSProperties {
  return {
    padding: "6px 13px",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    color: active ? "#0F5D2C" : "#8A968E",
    background: active ? "#fff" : "transparent",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,.08)" : "none",
  };
}

export function rekapBadge(kind: "over" | "near" | "ok"): CSSProperties {
  const m = {
    over: ["#FDECEC", "#C4363B"],
    near: ["#FBF3E0", "#A87400"],
    ok: ["#E6F3EB", "#0F5D2C"],
  } as const;
  return {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
    background: m[kind][0],
    color: m[kind][1],
  };
}

export const greenBtn: CSSProperties = {
  padding: "10px 15px",
  background: "#1B8A43",
  color: "#fff",
  border: "none",
  borderRadius: 9,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(27,138,67,.25)",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

export const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #E3E8E5",
  borderRadius: 14,
};

export const selectStyle: CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #DDE4DF",
  borderRadius: 9,
  fontSize: 13,
  background: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
