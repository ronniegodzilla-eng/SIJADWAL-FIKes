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
          padding: "48px 56px",
          color: "#EAF4EC",
        }}
      >
        {/* Motif grid dekoratif — bertema grid jadwal */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        {/* Blok jadwal semu — warna senada legenda prodi di grid asli */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          {/* Atas — di luar pita judul agar tak tumpang tindih */}
          <div
            style={{
              position: "absolute",
              top: "15%",
              right: "9%",
              width: 138,
              height: 64,
              borderRadius: 10,
              background: "rgba(14,159,110,.08)",
              borderLeft: "3px solid rgba(14,159,110,.3)",
              transform: "rotate(-6deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "7%",
              width: 118,
              height: 54,
              borderRadius: 10,
              background: "rgba(42,111,214,.075)",
              borderLeft: "3px solid rgba(42,111,214,.28)",
              transform: "rotate(5deg)",
            }}
          />
          {/* Bawah — mengisi ruang yang dulu dipakai statistik */}
          <div
            style={{
              position: "absolute",
              top: "66%",
              right: "12%",
              width: 148,
              height: 60,
              borderRadius: 10,
              background: "rgba(138,63,184,.07)",
              borderLeft: "3px solid rgba(138,63,184,.26)",
              transform: "rotate(4deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "80%",
              left: "10%",
              width: 108,
              height: 50,
              borderRadius: 10,
              background: "rgba(14,159,110,.065)",
              borderLeft: "3px solid rgba(14,159,110,.25)",
              transform: "rotate(-3deg)",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Image src="/logo-uis.png" alt="UIS" width={46} height={46} style={{ objectFit: "contain" }} />
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".04em" }}>
              UNIVERSITAS IBNU SINA
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
                alignSelf: "flex-start",
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
