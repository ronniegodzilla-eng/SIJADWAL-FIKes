"use client";

import { useState, type CSSProperties } from "react";
import { HoverBox } from "./primitives";
import { greenBtn } from "@/lib/ui";

const fLabel: CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#3A463F", marginBottom: 6 };
const fInput: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #DDE4DF",
  borderRadius: 9,
  fontSize: 13,
  background: "#fff",
  outline: "none",
};

function friendlyError(e: unknown): string {
  const code = e instanceof Error ? e.message : "";
  if (code.includes("auth/wrong-password") || code.includes("auth/invalid-credential"))
    return "Password saat ini salah.";
  if (code.includes("auth/too-many-requests"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  if (code.includes("auth/weak-password"))
    return "Password baru terlalu lemah (minimal 6 karakter).";
  if (code.includes("auth/requires-recent-login"))
    return "Sesi terlalu lama — silakan logout lalu masuk ulang, baru coba ganti password.";
  return "Gagal mengganti password. Periksa kembali isian Anda.";
}

export default function ChangePasswordModal({
  changePassword,
  onClose,
}: {
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setErr("");
    if (!current) {
      setErr("Isi password saat ini.");
      return;
    }
    if (next.length < 6) {
      setErr("Password baru minimal 6 karakter.");
      return;
    }
    if (next !== confirm) {
      setErr("Konfirmasi password baru tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(15,40,25,.42)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "60px 20px",
        overflow: "auto",
        animation: "sjOverlay .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,.28)",
          animation: "sjPanel .2s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #E9EDEA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800 }}>Ganti Password</div>
          <HoverBox
            onClick={onClose}
            style={{ cursor: "pointer", color: "#9AA69E", display: "flex" }}
            hoverStyle={{ color: "#17251C" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </HoverBox>
        </div>

        {done ? (
          <div style={{ padding: "22px" }}>
            <div
              style={{
                padding: 13,
                background: "#E6F3EB",
                border: "1px solid #C4E2CE",
                borderRadius: 10,
                fontSize: 13,
                color: "#0F5D2C",
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Password berhasil diganti.
            </div>
            <HoverBox
              as="button"
              onClick={onClose}
              style={{ ...greenBtn, width: "100%", justifyContent: "center" }}
              hoverStyle={{ background: "#167C3C" }}
            >
              Tutup
            </HoverBox>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={fLabel}>Password saat ini</label>
                <input
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  style={fInput}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label style={fLabel}>Password baru</label>
                <input
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  style={fInput}
                  autoComplete="new-password"
                  placeholder="minimal 6 karakter"
                />
              </div>
              <div>
                <label style={fLabel}>Konfirmasi password baru</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  style={fInput}
                  autoComplete="new-password"
                />
              </div>
              {err && <div style={{ color: "#C4363B", fontSize: 12.5, fontWeight: 600 }}>{err}</div>}
            </div>
            <div style={{ padding: "0 22px 20px", display: "flex", gap: 8 }}>
              <HoverBox
                as="button"
                onClick={submit}
                disabled={busy}
                style={{ ...greenBtn, flex: 1, justifyContent: "center", opacity: busy ? 0.7 : 1 }}
                hoverStyle={{ background: "#167C3C" }}
              >
                {busy ? "Menyimpan…" : "Simpan Password"}
              </HoverBox>
              <HoverBox
                as="button"
                onClick={onClose}
                style={{
                  padding: "11px 16px",
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
          </>
        )}
      </div>
    </div>
  );
}
