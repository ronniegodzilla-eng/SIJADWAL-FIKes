"use client";

import Image from "next/image";
import { useState } from "react";
import { HoverBox, TextInput } from "./primitives";
import { Footer } from "./Footer";

export default function Login({
  onSubmit,
  firebaseEnabled,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
  firebaseEnabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function doLogin() {
    setErr("");
    if (firebaseEnabled && (!email || !password)) {
      setErr("Isi email dan kata sandi.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(email, password);
    } catch {
      setErr("Email atau kata sandi salah.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        background: "#0F5D2C",
      }}
    >
      {/* Panel kiri — brand */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(155deg, #12703A 0%, #0F5D2C 55%, #0B4A24 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          color: "#EAF4EC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image src="/logo-uis.png" alt="UIS" width={46} height={46} style={{ objectFit: "contain" }} />
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".04em" }}>
            UNIVERSITAS IBNU SINA
          </div>
        </div>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 13px",
              borderRadius: 999,
              background: "rgba(246,201,21,.16)",
              border: "1px solid rgba(246,201,21,.4)",
              color: "#F6D64A",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".04em",
              marginBottom: 22,
            }}
          >
            SISTEM PENJADWALAN KULIAH
          </div>
          <h1
            style={{
              fontSize: 46,
              lineHeight: 1.04,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-.02em",
            }}
          >
            SIJADWAL<span style={{ color: "#F6C915" }}>·</span>FIKes
          </h1>
        </div>
        <div style={{ display: "flex", gap: 26, fontSize: 12.5, color: "#9EC1A8" }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#F6C915" }}>3</div>
            Program Studi
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#F6C915" }}>0</div>
            Toleransi Bentrok
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#F6C915" }}>
              &lt;100ms
            </div>
            Validasi
          </div>
        </div>
      </div>

      {/* Panel kanan — form */}
      <div
        style={{
          background: "#FBFCFB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.01em", marginBottom: 6 }}>
            Masuk ke akun Anda
          </div>
          <div style={{ fontSize: 13.5, color: "#5E6B62", marginBottom: 30 }}>
            Petugas penjadwalan Fakultas Ilmu Kesehatan
          </div>
          <label style={labelStyle}>Email</label>
          <TextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
            type="email"
            placeholder="petugas@uis.ac.id"
            style={{ ...fieldStyle, marginBottom: 18 }}
          />
          <label style={labelStyle}>Kata sandi</label>
          <TextInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
            type="password"
            placeholder="••••••••"
            style={{ ...fieldStyle, marginBottom: 24 }}
          />
          {err && (
            <div style={{ color: "#C4363B", fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
              {err}
            </div>
          )}
          <HoverBox
            as="button"
            onClick={doLogin}
            disabled={busy}
            style={{
              width: "100%",
              padding: 13,
              background: "#1B8A43",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14.5,
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(27,138,67,.28)",
            }}
            hoverStyle={{ background: "#167C3C" }}
          >
            {busy ? "Memproses…" : "Masuk"}
          </HoverBox>
          <div
            style={{
              marginTop: 22,
              padding: "12px 14px",
              background: "#F1F5F2",
              borderRadius: 9,
              fontSize: 12,
              color: "#5E6B62",
              lineHeight: 1.5,
            }}
          >
            {firebaseEnabled ? (
              <>Masuk dengan akun Firebase yang terdaftar di koleksi <b>users</b>.</>
            ) : (
              <>
                Mode demo — cukup klik <b>Masuk</b>. Ganti peran (Admin / Petugas)
                dari bilah atas setelah masuk.
              </>
            )}
          </div>
          <Footer style={{ marginTop: 26 }} />
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: "#3A463F",
  marginBottom: 7,
} as const;

const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #DDE4DF",
  borderRadius: 10,
  fontSize: 14,
  background: "#fff",
} as const;
