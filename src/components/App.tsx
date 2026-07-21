"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { FormDraft, Jadwal, JadwalRaw } from "@/lib/types";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import { navStyle, roleBtn } from "@/lib/ui";
import { HoverBox } from "./primitives";
import Login from "./Login";
import GridMingguan from "./GridMingguan";
import FormJadwal from "./FormJadwal";
import CariSlot from "./CariSlot";
import RekapBeban from "./RekapBeban";
import MasterData from "./MasterData";
import Ekspor from "./Ekspor";
import UsersPeriode from "./UsersPeriode";

type Screen = "grid" | "slot" | "rekap" | "master" | "ekspor" | "users";
type ViewMode = "prodi" | "dosen" | "ruangan" | "kelas";
type Role = "admin" | "petugas";

const TITLES: Record<Screen, [string, string]> = {
  grid: ["Grid Jadwal Mingguan", "Okupansi lintas prodi · periode aktif"],
  slot: ["Cari Slot Kosong", "Temukan waktu bebas bentrok untuk dosen + kelas"],
  rekap: ["Rekap Beban Dosen", "Akumulasi SKS efektif lintas prodi"],
  master: ["Master Data", "Data acuan penjadwalan fakultas"],
  ekspor: ["Ekspor Jadwal", "Cetak per prodi, dosen, atau ruangan"],
  users: ["Pengguna & Periode", "Kelola akun dan periode akademik"],
};

// Prodi yang dipegang petugas demo (mudah diganti bila auth Firebase aktif).
const PETUGAS_PRODI = "k3";

export default function App() {
  const authState = useAuth();
  const [viewPeriodeId, setViewPeriodeId] = useState<string | null>(null);
  const data = useAppData(authState.authed, viewPeriodeId);
  const [role, setRole] = useState<Role>("admin");
  const [screen, setScreen] = useState<Screen>("grid");

  const [viewMode, setViewMode] = useState<ViewMode>("prodi");
  const [filterProdi, setFilterProdi] = useState("k3");
  const [filterDosen, setFilterDosen] = useState("d1");
  const [filterRuangan, setFilterRuangan] = useState("r1");
  const [filterKelas, setFilterKelas] = useState("kls-km-25a");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<FormDraft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  if (!authState.ready && authState.firebaseEnabled) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6B776F",
          fontSize: 14,
        }}
      >
        Memuat…
      </div>
    );
  }
  if (!authState.authed)
    return <Login onSubmit={authState.login} firebaseEnabled={authState.firebaseEnabled} />;

  const firebaseMode = authState.firebaseEnabled;
  // Mode Firebase: peran dari custom claims. Mode demo: dari sakelar bilah atas.
  const isAdmin = firebaseMode ? authState.claims?.admin === true : role === "admin";
  const myProdi = firebaseMode
    ? authState.claims?.prodiId ?? null
    : isAdmin
    ? null
    : PETUGAS_PRODI;
  // Periode historis (non-aktif) → read-only: jadwal tak bisa diubah (PRD F1).
  const readOnlyPeriode = !!data.shownPeriode && !data.shownPeriode.aktif;
  const canEdit = (e: Jadwal) =>
    !readOnlyPeriode && (isAdmin || e.prodiId === myProdi);
  const userId = authState.email ?? (isAdmin ? "admin" : `petugas-${myProdi}`);

  const seedMe =
    data.users.find((u) => (isAdmin ? u.peran === "admin" : u.prodiId === myProdi)) ??
    data.users[0];
  // Di mode Firebase tampilkan email akun yang login; nama dari seed users bila cocok.
  const meName = authState.email
    ? data.users.find((u) => u.email === authState.email)?.nama ?? authState.email
    : seedMe?.nama ?? "Pengguna";
  const meInitial = meName.charAt(0).toUpperCase();
  const prodiKode = myProdi
    ? data.prodi.find((p) => p.id === myProdi)?.kode ?? myProdi
    : null;
  const roleLabel = isAdmin ? "Admin Fakultas" : `Petugas Prodi ${prodiKode ?? ""}`.trim();

  // Nilai filter dengan fallback ke item pertama bila id tersimpan tak ada lagi
  // (mis. setelah data demo diganti data asli).
  const pick = (stored: string, list: { id: string }[]) =>
    list.some((x) => x.id === stored) ? stored : list[0]?.id ?? "";
  const filterValue =
    viewMode === "prodi"
      ? pick(filterProdi, data.prodi)
      : viewMode === "dosen"
      ? pick(filterDosen, data.dosen)
      : viewMode === "ruangan"
      ? pick(filterRuangan, data.ruangan)
      : pick(filterKelas, data.kelas);

  function setFilter(value: string) {
    if (viewMode === "prodi") setFilterProdi(value);
    else if (viewMode === "dosen") setFilterDosen(value);
    else if (viewMode === "ruangan") setFilterRuangan(value);
    else setFilterKelas(value);
    setSelectedId(null);
  }

  function openForm(entry: Jadwal | null) {
    if (entry) {
      setEditId(entry.id);
      setFormInitial({
        mataKuliahId: entry.mkId,
        kelasId: entry.kelasId,
        dosenIds: [...entry.dosenIds],
        mode: entry.mode,
        ruanganId: entry.ruanganId || "",
        hari: entry.hari,
        jamMulai: entry.jamMulai,
      });
    } else {
      setEditId(null);
      setFormInitial({
        mataKuliahId: "",
        kelasId: "",
        dosenIds: [],
        mode: "offline",
        ruanganId: "",
        hari: 1,
        jamMulai: 480,
      });
    }
    setFormOpen(true);
  }

  async function onSave(entry: JadwalRaw) {
    await data.saveJadwal(entry);
    setFormOpen(false);
    setEditId(null);
    setSelectedId(null);
  }

  async function onDelete(id: string) {
    await data.deleteJadwal(id);
    setSelectedId(null);
  }

  function useSlot(form: FormDraft) {
    setEditId(null);
    setFormInitial(form);
    setFormOpen(true);
    setScreen("grid");
  }

  const doLogout = authState.logout;

  const navItems: { id: Screen; label: string; icon: JSX.Element; adminOnly?: boolean }[] = [
    { id: "grid", label: "Grid Mingguan", icon: <IconGrid /> },
    { id: "slot", label: "Cari Slot Kosong", icon: <IconSearch /> },
    { id: "rekap", label: "Rekap Beban Dosen", icon: <IconChart /> },
  ];
  const dataItems: { id: Screen; label: string; icon: JSX.Element; adminOnly?: boolean }[] = [
    { id: "master", label: "Master Data", icon: <IconDb /> },
    { id: "ekspor", label: "Ekspor", icon: <IconExport /> },
    { id: "users", label: "Pengguna & Periode", icon: <IconUsers />, adminOnly: true },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#EEF1EF" }}>
      {/* SIDEBAR */}
      <aside
        className="no-print"
        style={{
          width: 234,
          flexShrink: 0,
          background: "#0F5D2C",
          color: "#CFE3D5",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "20px 18px",
            display: "flex",
            alignItems: "center",
            gap: 11,
            borderBottom: "1px solid rgba(255,255,255,.09)",
          }}
        >
          <Image src="/logo-uis.png" alt="UIS" width={38} height={38} style={{ objectFit: "contain" }} />
          <div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: "-.01em" }}>
              SIJADWAL
            </div>
            <div style={{ fontSize: 10.5, color: "#8FBB9C", fontWeight: 600, letterSpacing: ".06em" }}>
              FIKes · UIS
            </div>
          </div>
        </div>

        <nav style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          <SectionLabel>PENJADWALAN</SectionLabel>
          {navItems.map((it) => (
            <NavItem
              key={it.id}
              active={screen === it.id}
              onClick={() => {
                setScreen(it.id);
                setSelectedId(null);
              }}
              icon={it.icon}
              label={it.label}
            />
          ))}
          <SectionLabel style={{ paddingTop: 14 }}>DATA &amp; LAPORAN</SectionLabel>
          {dataItems
            .filter((it) => !it.adminOnly || isAdmin)
            .map((it) => (
              <NavItem
                key={it.id}
                active={screen === it.id}
                onClick={() => {
                  setScreen(it.id);
                  setSelectedId(null);
                }}
                icon={it.icon}
                label={it.label}
              />
            ))}
        </nav>

        <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,.09)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 8,
              borderRadius: 9,
              background: "rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#F6C915",
                color: "#0F5D2C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {meInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {meName}
              </div>
              <div style={{ fontSize: 10.5, color: "#8FBB9C" }}>
                {roleLabel}
              </div>
            </div>
            <HoverBox
              onClick={doLogout}
              title="Keluar"
              style={{ cursor: "pointer", color: "#8FBB9C", display: "flex" }}
              hoverStyle={{ color: "#fff" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </HoverBox>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* TOPBAR */}
        <header
          className="no-print"
          style={{
            height: 62,
            flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid #E3E8E5",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 18,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1.1 }}>
              {TITLES[screen][0]}
            </div>
            <div style={{ fontSize: 12, color: "#6B776F" }}>{TITLES[screen][1]}</div>
          </div>
          {/* Pemilih periode — pilih periode lama untuk lihat jadwalnya (read-only). */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "4px 8px 4px 12px",
              background: readOnlyPeriode ? "#FBF3E0" : "#E6F3EB",
              border: `1px solid ${readOnlyPeriode ? "#ECDCB0" : "#C4E2CE"}`,
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              color: readOnlyPeriode ? "#A87400" : "#0F5D2C",
            }}
            title={readOnlyPeriode ? "Periode non-aktif — read-only" : "Periode aktif"}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: readOnlyPeriode ? "#E0A100" : "#1B8A43",
                boxShadow: readOnlyPeriode
                  ? "0 0 0 3px rgba(224,161,0,.18)"
                  : "0 0 0 3px rgba(27,138,67,.18)",
              }}
            />
            <select
              value={data.shownPeriode?.id ?? ""}
              onChange={(e) => {
                setViewPeriodeId(e.target.value);
                setSelectedId(null);
              }}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 12.5,
                fontWeight: 700,
                color: "inherit",
                cursor: "pointer",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              {data.periode.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                  {p.aktif ? " (aktif)" : ""}
                </option>
              ))}
            </select>
          </div>
          {firebaseMode ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 12px",
                background: isAdmin ? "#F3E9FA" : "#E6F3EB",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 700,
                color: isAdmin ? "#8A3FB8" : "#0F5D2C",
              }}
            >
              {roleLabel}
            </div>
          ) : (
            // Mode demo: sakelar peran untuk mencoba kedua sudut pandang.
            <div style={{ display: "flex", background: "#F1F4F2", borderRadius: 9, padding: 3 }}>
              <div onClick={() => setRole("admin")} style={roleBtn(isAdmin)}>
                Admin
              </div>
              <div
                onClick={() => {
                  setRole("petugas");
                  if (screen === "users") setScreen("grid");
                }}
                style={roleBtn(!isAdmin)}
              >
                Petugas K3
              </div>
            </div>
          )}
        </header>

        <main style={{ flex: 1, minWidth: 0, padding: "22px 24px 40px", overflow: "auto" }}>
          {screen === "grid" && (
            <GridMingguan
              catalog={data.catalog}
              jadwal={data.jadwal}
              viewMode={viewMode}
              filterValue={filterValue}
              selectedId={selectedId}
              canEdit={canEdit}
              onSetViewMode={(v) => {
                setViewMode(v);
                setSelectedId(null);
              }}
              onSetFilter={setFilter}
              onSelect={setSelectedId}
              onOpenNewForm={() => openForm(null)}
              onEdit={openForm}
              onDelete={onDelete}
              readOnly={readOnlyPeriode}
            />
          )}
          {screen === "slot" && (
            <CariSlot catalog={data.catalog} jadwal={data.jadwal} onUseSlot={useSlot} />
          )}
          {screen === "rekap" && <RekapBeban catalog={data.catalog} jadwal={data.jadwal} />}
          {screen === "master" && (
            <MasterData
              catalog={data.catalog}
              isAdmin={isAdmin}
              firebaseMode={firebaseMode}
              getToken={authState.getToken}
            />
          )}
          {screen === "ekspor" && (
            <Ekspor
              catalog={data.catalog}
              jadwal={data.jadwal}
              periodeAktif={data.shownPeriode ?? data.periodeAktif}
            />
          )}
          {screen === "users" && isAdmin && (
            <UsersPeriode
              catalog={data.catalog}
              seedUsers={data.users}
              periode={data.periode}
              firebaseMode={firebaseMode}
              getToken={authState.getToken}
            />
          )}
        </main>
      </div>

      {formOpen && formInitial && (
        <FormJadwal
          catalog={data.catalog}
          jadwal={data.jadwal}
          isAdmin={isAdmin}
          myProdi={myProdi}
          editId={editId}
          initialForm={formInitial}
          userId={userId}
          onSave={onSave}
          onClose={() => {
            setFormOpen(false);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".1em",
        color: "#6FA07D",
        padding: "6px 10px 4px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: JSX.Element;
  label: string;
}) {
  return (
    <HoverBox onClick={onClick} style={navStyle(active)} hoverStyle={active ? undefined : { background: "rgba(255,255,255,.07)" }}>
      {icon}
      {label}
    </HoverBox>
  );
}

// ── Ikon ────────────────────────────────────────────────────────────
const iconProps = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
} as const;

function IconGrid() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4M9 13h6M9 17h4" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4M11 8v3l2 1" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg {...iconProps}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function IconDb() {
  return (
    <svg {...iconProps}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}
function IconExport() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M17 6l2 2 3-3.5" />
    </svg>
  );
}
