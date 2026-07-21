"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Jadwal,
  JadwalRaw,
  Periode,
  AppUser,
  Prodi,
  Dosen,
  Ruangan,
  MataKuliah,
  Kelas,
} from "@/lib/types";
import { Catalog, enrich } from "@/lib/catalog";
import {
  seedProdi,
  seedDosen,
  seedRuangan,
  seedMataKuliah,
  seedKelas,
  seedPeriode,
  seedUsers,
  seedJadwal,
} from "@/lib/seed";
import {
  normProdiList,
  normDosenList,
  normRuanganList,
  normMkList,
  normKelasList,
  normPeriodeList,
  type Doc,
} from "@/lib/normalize";
import { firebaseEnabled, db } from "@/lib/firebase";

/**
 * Sumber data aplikasi. Dua mode:
 *  - Firebase aktif  → jadwal disubscribe dari Firestore (onSnapshot) untuk
 *    periode aktif, sesuai strategi PRD §F4 (muat semua entri, cek di client).
 *    Subscribe hanya setelah pengguna terautentikasi (agar lolos security rules).
 *  - Mode demo       → seluruh data in-memory dari seed.
 * Master data dikelola lokal (cukup untuk CRUD admin & mode demo).
 *
 * @param authed        true bila pengguna sudah login (memicu subscribe Firestore)
 * @param viewPeriodeId periode yang jadwalnya ditampilkan (default: periode aktif)
 */
export function useAppData(authed: boolean, viewPeriodeId?: string | null) {
  const [prodi, setProdi] = useState<Prodi[]>(seedProdi);
  const [dosen, setDosen] = useState<Dosen[]>(seedDosen);
  const [ruangan, setRuangan] = useState<Ruangan[]>(seedRuangan);
  const [mk, setMk] = useState<MataKuliah[]>(seedMataKuliah);
  const [kelas, setKelas] = useState<Kelas[]>(seedKelas);
  const [periode, setPeriode] = useState<Periode[]>(seedPeriode);
  const [users] = useState<AppUser[]>(seedUsers);

  // Subscribe master data dari Firestore setelah login (mode Firebase).
  // Koleksi kosong dibiarkan memakai seed agar app tak tampil hampa.
  useEffect(() => {
    if (!firebaseEnabled || !db || !authed) return;
    const unsubs: (() => void)[] = [];
    (async () => {
      const { collection, onSnapshot } = await import("firebase/firestore");
      const sub = (name: string, apply: (docs: Doc[]) => void) => {
        const u = onSnapshot(
          collection(db!, name),
          (snap) => {
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Doc[];
            if (docs.length) apply(docs);
          },
          (err) => console.error(`Firestore ${name}:`, err.message)
        );
        unsubs.push(u);
      };
      sub("prodi", (d) => setProdi(normProdiList(d)));
      sub("dosen", (d) => setDosen(normDosenList(d)));
      sub("ruangan", (d) => setRuangan(normRuanganList(d)));
      sub("mataKuliah", (d) => setMk(normMkList(d)));
      sub("kelas", (d) => setKelas(normKelasList(d)));
      sub("periode", (d) => setPeriode(normPeriodeList(d)));
    })();
    return () => unsubs.forEach((u) => u());
  }, [authed]);

  const catalog: Catalog = useMemo(
    () => ({ prodi, dosen, ruangan, mk, kelas }),
    [prodi, dosen, ruangan, mk, kelas]
  );

  const periodeAktif = useMemo(
    () => periode.find((p) => p.aktif) ?? periode[0],
    [periode]
  );

  // Periode yang jadwalnya ditampilkan (default: aktif).
  const shownPeriodeId = viewPeriodeId || periodeAktif?.id;
  const shownPeriode = useMemo(
    () => periode.find((p) => p.id === shownPeriodeId) ?? periodeAktif,
    [periode, shownPeriodeId, periodeAktif]
  );

  const [rawJadwal, setRawJadwal] = useState<JadwalRaw[]>(seedJadwal);
  const [ready, setReady] = useState(!firebaseEnabled);

  // Subscribe Firestore setelah login (agar lolos security rules).
  useEffect(() => {
    if (!firebaseEnabled || !db || !authed || !shownPeriodeId) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const { collection, query, where, onSnapshot } = await import(
        "firebase/firestore"
      );
      const q = query(
        collection(db!, "jadwal"),
        where("periodeId", "==", shownPeriodeId)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: JadwalRaw[] = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: d.id,
              ...(data as Omit<JadwalRaw, "id">),
              // Terima `mkId` (app) maupun `mataKuliahId` (nama field PRD §6).
              mkId: (data.mkId ?? data.mataKuliahId) as string,
            };
          });
          setRawJadwal(rows);
          setReady(true);
        },
        (err) => console.error("Firestore jadwal subscription:", err.message)
      );
    })();
    return () => unsub?.();
  }, [shownPeriodeId, authed]);

  const jadwal: Jadwal[] = useMemo(
    () => rawJadwal.map((j) => enrich(catalog, j)),
    [rawJadwal, catalog]
  );

  // ── Mutasi jadwal ───────────────────────────────────────────────────
  const saveJadwal = useCallback(
    async (entry: JadwalRaw) => {
      if (firebaseEnabled && db) {
        const { doc, setDoc } = await import("firebase/firestore");
        const { id, mkId, ...data } = entry;
        // Denormalisasi (PRD §6) — prodiId wajib untuk security rules per-prodi.
        // Persist pakai nama field PRD `mataKuliahId`.
        const e = enrich(catalog, entry);
        await setDoc(doc(db!, "jadwal", id), {
          ...data,
          mataKuliahId: mkId,
          prodiId: e.prodiId,
          jamSelesai: e.jamSelesai,
          sksEfektifPerDosen: e.sksEff,
          periodeId: shownPeriodeId,
        });
        return;
      }
      setRawJadwal((prev) => {
        const exists = prev.some((j) => j.id === entry.id);
        return exists
          ? prev.map((j) => (j.id === entry.id ? entry : j))
          : [...prev, entry];
      });
    },
    [shownPeriodeId, catalog]
  );

  const deleteJadwal = useCallback(async (id: string) => {
    if (firebaseEnabled && db) {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "jadwal", id));
      return;
    }
    setRawJadwal((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return {
    catalog,
    prodi,
    dosen,
    ruangan,
    mk,
    kelas,
    periode,
    users,
    periodeAktif,
    shownPeriode,
    jadwal,
    ready,
    saveJadwal,
    deleteJadwal,
    firebaseEnabled,
  };
}

export type AppData = ReturnType<typeof useAppData>;
