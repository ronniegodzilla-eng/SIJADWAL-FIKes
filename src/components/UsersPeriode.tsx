"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { AppUser, Periode } from "@/lib/types";
import { Catalog, prodiById } from "@/lib/catalog";
import { HoverBox } from "./primitives";

interface ApiUser {
  uid: string;
  email: string | null;
  nama: string;
  peran: "admin" | "petugas";
  prodiId: string | null;
  aktif: boolean;
}

interface Props {
  catalog: Catalog;
  seedUsers: AppUser[];
  periode: Periode[];
  firebaseMode: boolean;
  getToken: () => Promise<string | null>;
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#3A463F",
  marginBottom: 6,
};
const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #DDE4DF",
  borderRadius: 8,
  fontSize: 13,
  background: "#fff",
  outline: "none",
};

export default function UsersPeriode({
  catalog,
  seedUsers,
  periode,
  firebaseMode,
  getToken,
}: Props) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(firebaseMode);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const api = useCallback(
    async (path: string, method: string, body?: unknown) => {
      const token = await getToken();
      const res = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Gagal (${res.status}).`);
      return data;
    },
    [getToken]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/users", "GET");
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pengguna.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (firebaseMode) load();
  }, [firebaseMode, load]);

  async function resetPassword(u: ApiUser) {
    const pw = window.prompt(
      `Password baru untuk ${u.nama} (${u.email}). Min. 6 karakter:`
    );
    if (!pw) return;
    try {
      await api(`/api/users/${u.uid}/password`, "POST", { password: pw });
      alert(`Password ${u.email} berhasil diganti.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengganti password.");
    }
  }

  async function toggleDisable(u: ApiUser) {
    const makeDisabled = u.aktif;
    if (
      makeDisabled &&
      !window.confirm(`Nonaktifkan akun ${u.email}? Pengguna tidak bisa login.`)
    )
      return;
    try {
      await api(`/api/users/${u.uid}/disable`, "POST", { disabled: makeDisabled });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengubah status akun.");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 20, alignItems: "start" }}>
      {/* Pengguna */}
      <div>
        <div style={{ background: "#fff", border: "1px solid #E3E8E5", borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              padding: "15px 18px",
              borderBottom: "1px solid #E9EDEA",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800 }}>Pengguna</div>
            {firebaseMode && (
              <HoverBox
                as="button"
                onClick={() => setShowForm((v) => !v)}
                style={btnGreen}
                hoverStyle={{ background: "#167C3C" }}
              >
                {showForm ? "Tutup" : "+ Akun"}
              </HoverBox>
            )}
          </div>

          {showForm && <CreateForm catalog={catalog} api={api} onDone={() => { setShowForm(false); load(); }} />}

          {!firebaseMode ? (
            <SeedTable catalog={catalog} seedUsers={seedUsers} />
          ) : loading ? (
            <div style={{ padding: 20, fontSize: 13, color: "#6B776F" }}>Memuat pengguna…</div>
          ) : error ? (
            <div style={{ padding: 18, fontSize: 13, color: "#C4363B" }}>
              {error}
              <div style={{ marginTop: 8 }}>
                <HoverBox as="button" onClick={load} style={{ ...btnGreen, background: "#6B776F" }} hoverStyle={{ background: "#55605A" }}>
                  Coba lagi
                </HoverBox>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 0.8fr 1.4fr",
                  padding: "11px 18px",
                  background: "#FAFBFA",
                  borderBottom: "1px solid #E9EDEA",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#6B776F",
                }}
              >
                <div>NAMA / EMAIL</div>
                <div>PERAN</div>
                <div>PRODI</div>
                <div style={{ textAlign: "right" }}>AKSI</div>
              </div>
              {users.map((u) => (
                <div
                  key={u.uid}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 0.8fr 1.4fr",
                    padding: "12px 18px",
                    borderBottom: "1px solid #F2F4F2",
                    fontSize: 13,
                    alignItems: "center",
                    opacity: u.aktif ? 1 : 0.55,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{u.nama}</div>
                    <div style={{ fontSize: 11, color: "#9AA69E" }}>{u.email}</div>
                  </div>
                  <div>
                    <span style={roleBadge(u.peran)}>{u.peran === "admin" ? "Admin" : "Petugas"}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "#5E6B62" }}>
                    {u.prodiId ? prodiById(catalog, u.prodiId)?.kode ?? u.prodiId : "—"}
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <HoverBox onClick={() => resetPassword(u)} style={miniBtn("#E6F3EB", "#0F5D2C", "#C4E2CE")} hoverStyle={{ background: "#D8ECE0" }}>
                      Reset PW
                    </HoverBox>
                    <HoverBox
                      onClick={() => toggleDisable(u)}
                      style={
                        u.aktif
                          ? miniBtn("#FDECEC", "#C4363B", "#F5CACA")
                          : miniBtn("#F1F4F2", "#5E6B62", "#DDE4DF")
                      }
                      hoverStyle={{ opacity: 0.85 }}
                    >
                      {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </HoverBox>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div style={{ padding: 18, fontSize: 13, color: "#9AA69E" }}>Belum ada pengguna.</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Periode */}
      <PeriodePanel periode={periode} firebaseMode={firebaseMode} api={api} />
    </div>
  );
}

function PeriodePanel({
  periode,
  firebaseMode,
  api,
}: {
  periode: Periode[];
  firebaseMode: boolean;
  api: (p: string, m: string, b?: unknown) => Promise<any>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function activate(id: string) {
    if (!window.confirm("Jadikan periode ini yang aktif? Periode aktif lain akan dinonaktifkan.")) return;
    setBusyId(id);
    try {
      await api(`/api/periode/${id}/activate`, "POST", {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengaktifkan periode.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E3E8E5", borderRadius: 14, overflow: "hidden" }}>
      <div
        style={{
          padding: "15px 18px",
          borderBottom: "1px solid #E9EDEA",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800 }}>Periode Akademik</div>
        {firebaseMode && (
          <HoverBox
            as="button"
            onClick={() => setShowForm((v) => !v)}
            style={btnGreen}
            hoverStyle={{ background: "#167C3C" }}
          >
            {showForm ? "Tutup" : "+ Periode"}
          </HoverBox>
        )}
      </div>

      {showForm && <PeriodeForm api={api} onDone={() => setShowForm(false)} />}

      {periode.map((p) => (
        <div
          key={p.id}
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #F2F4F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.nama}</div>
            <div style={{ fontSize: 11.5, color: "#9AA69E", whiteSpace: "nowrap" }}>
              {p.mulai} – {p.selesai}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {firebaseMode && !p.aktif && (
              <HoverBox
                onClick={() => activate(p.id)}
                style={{
                  padding: "5px 10px",
                  background: "#E6F3EB",
                  color: "#0F5D2C",
                  border: "1px solid #C4E2CE",
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: busyId === p.id ? 0.6 : 1,
                }}
                hoverStyle={{ background: "#D8ECE0" }}
              >
                {busyId === p.id ? "…" : "Aktifkan"}
              </HoverBox>
            )}
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                background: p.aktif ? "#E6F3EB" : "#F1F4F2",
                color: p.aktif ? "#0F5D2C" : "#8A968E",
              }}
            >
              {p.aktif ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PeriodeForm({
  api,
  onDone,
}: {
  api: (p: string, m: string, b?: unknown) => Promise<any>;
  onDone: () => void;
}) {
  const [nama, setNama] = useState("");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      await api("/api/periode", "POST", {
        nama,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat periode.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "16px 18px", borderBottom: "1px solid #E9EDEA", background: "#FAFBFA" }}>
      <label style={labelStyle}>Nama periode</label>
      <input
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        style={{ ...fieldStyle, marginBottom: 10 }}
        placeholder="mis. Genap 2026/2027"
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Tanggal mulai</label>
          <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tanggal selesai</label>
          <input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} style={fieldStyle} />
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "#9AA69E", marginBottom: 10 }}>
        Periode baru dibuat nonaktif. Klik <b>Aktifkan</b> untuk menjadikannya periode berjalan.
      </div>
      {err && <div style={{ color: "#C4363B", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
      <HoverBox as="button" onClick={submit} disabled={busy} style={{ ...btnGreen, opacity: busy ? 0.7 : 1 }} hoverStyle={{ background: "#167C3C" }}>
        {busy ? "Menyimpan…" : "Simpan Periode"}
      </HoverBox>
    </div>
  );
}

function CreateForm({
  catalog,
  api,
  onDone,
}: {
  catalog: Catalog;
  api: (p: string, m: string, b?: unknown) => Promise<any>;
  onDone: () => void;
}) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [peran, setPeran] = useState<"admin" | "petugas">("petugas");
  const [prodiId, setProdiId] = useState(catalog.prodi[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      await api("/api/users", "POST", {
        nama,
        email,
        password,
        peran,
        prodiId: peran === "petugas" ? prodiId : null,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat akun.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "16px 18px", borderBottom: "1px solid #E9EDEA", background: "#FAFBFA" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Nama lengkap</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} style={fieldStyle} placeholder="mis. Wulan Sari" />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={fieldStyle} placeholder="petugas@uis.ac.id" />
        </div>
        <div>
          <label style={labelStyle}>Password awal</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="text" style={fieldStyle} placeholder="min. 6 karakter" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>Peran</label>
            <select value={peran} onChange={(e) => setPeran(e.target.value as "admin" | "petugas")} style={{ ...fieldStyle, cursor: "pointer" }}>
              <option value="petugas">Petugas</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {peran === "petugas" && (
            <div>
              <label style={labelStyle}>Prodi</label>
              <select value={prodiId} onChange={(e) => setProdiId(e.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                {catalog.prodi.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kode}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      {err && <div style={{ color: "#C4363B", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
      <HoverBox as="button" onClick={submit} disabled={busy} style={{ ...btnGreen, opacity: busy ? 0.7 : 1 }} hoverStyle={{ background: "#167C3C" }}>
        {busy ? "Membuat…" : "Buat Akun"}
      </HoverBox>
    </div>
  );
}

function SeedTable({ catalog, seedUsers }: { catalog: Catalog; seedUsers: AppUser[] }) {
  return (
    <>
      <div style={{ padding: "10px 18px", fontSize: 12, color: "#B0803A", background: "#FBF3E0", borderBottom: "1px solid #ECE0C0" }}>
        Mode demo — kelola akun (buat / reset password) aktif saat terhubung Firebase.
      </div>
      {seedUsers.map((u) => (
        <div
          key={u.email}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            padding: "12px 18px",
            borderBottom: "1px solid #F2F4F2",
            fontSize: 13,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{u.nama}</div>
            <div style={{ fontSize: 11, color: "#9AA69E" }}>{u.email}</div>
          </div>
          <div>
            <span style={roleBadge(u.peran)}>{u.peran === "admin" ? "Admin" : "Petugas"}</span>
          </div>
          <div style={{ textAlign: "right", fontWeight: 600, color: "#5E6B62" }}>
            {u.prodiId ? prodiById(catalog, u.prodiId)?.kode : "—"}
          </div>
        </div>
      ))}
    </>
  );
}

const btnGreen: CSSProperties = {
  padding: "7px 12px",
  background: "#1B8A43",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

function miniBtn(bg: string, color: string, border: string): CSSProperties {
  return {
    padding: "5px 9px",
    background: bg,
    color,
    border: `1px solid ${border}`,
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function roleBadge(peran: "admin" | "petugas"): CSSProperties {
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
    background: peran === "admin" ? "#F3E9FA" : "#E6F3EB",
    color: peran === "admin" ? "#8A3FB8" : "#0F5D2C",
  };
}
