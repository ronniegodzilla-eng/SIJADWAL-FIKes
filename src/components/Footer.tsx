"use client";

import type { CSSProperties } from "react";

/** Footer copyright aplikasi. */
export function Footer({
  style,
  variant = "light",
}: {
  style?: CSSProperties;
  /** "light" untuk latar terang, "dark" untuk latar hijau gelap (sidebar). */
  variant?: "light" | "dark";
}) {
  const year = new Date().getFullYear();
  const color = variant === "dark" ? "#8FBB9C" : "#9AA69E";
  return (
    <div
      style={{
        fontSize: 11.5,
        color,
        textAlign: "center",
        lineHeight: 1.5,
        ...style,
      }}
    >
      © {year} Roni Saputra, S.Si., M.Si.
      <br />
      Kontak:{" "}
      <a href="mailto:ronniegodzilla@gmail.com" style={{ color: "inherit" }}>
        ronniegodzilla@gmail.com
      </a>
    </div>
  );
}
