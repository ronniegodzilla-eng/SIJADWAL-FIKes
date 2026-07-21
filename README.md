# SIJADWAL · FIKes UIS

Sistem Penjadwalan Mata Kuliah Fakultas Ilmu Kesehatan, Universitas Ibnu Sina —
penyusunan jadwal manual dengan **validasi bentrok real-time lintas prodi**
(dosen, ruangan, kelas). Implementasi dari [PRD](PRD-Penjadwalan-Kuliah-FIKes.md)
dan prototipe Claude Design `SIJADWAL-FIKes.dc.html`.

**Stack:** Next.js 14 (App Router) · TypeScript · Firebase (Auth + Firestore) ·
deploy Vercel.

## Menjalankan lokal

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build produksi
```

## Mode Demo vs Firebase

Aplikasi berjalan langsung **tanpa konfigurasi apa pun** dalam **Mode Demo**:
seluruh data contoh dimuat di memori, seluruh alur (grid, form + validasi, cari
slot, rekap, master, ekspor) dapat dicoba. Klik **Masuk** tanpa kredensial, lalu
ganti peran Admin/Petugas dari bilah atas.

Untuk mengaktifkan **Auth + Firestore**, salin `.env.local.example` menjadi
`.env.local` dan isi kredensial project Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Saat variabel terisi, login memakai Firebase Authentication (email/password) dan
koleksi `jadwal` disubscribe via `onSnapshot` (periode aktif). Deploy Vercel:
set variabel yang sama di Project → Settings → Environment Variables.

## Setup Firebase (project `sijadwal-fikes`)

Skrip di `scripts/` memakai service account (Admin SDK). Letakkan kunci di
`.secrets/serviceAccountKey.json` (folder ini sudah di-`.gitignore`, **jangan
di-commit**) atau set env `GOOGLE_APPLICATION_CREDENTIALS`.

```bash
node scripts/get-web-config.mjs   # tulis .env.local dari config Web SDK
node scripts/seed-firestore.mjs   # isi Firestore: master data + 18 jadwal
node scripts/deploy-rules.mjs     # publish firestore.rules (butuh IAM Rules Admin)
```

`.env.local` dan seed Firestore sudah dijalankan. **Dua langkah terakhir manual
di Firebase Console** (butuh hak yang tidak dimiliki service account):

1. **Publish security rules** — Firestore Database → Rules → tempel isi
   [`firestore.rules`](firestore.rules) → **Publish**. (DB saat ini masih
   *locked mode*, jadi app belum bisa membaca sampai rules ini terbit.)
   Alternatif: beri service account peran **Firebase Rules Admin** di IAM lalu
   jalankan `node scripts/deploy-rules.mjs`.
2. **Buat akun login** — Authentication → Sign-in method → aktifkan
   **Email/Password** → tab Users → **Add user** (mis. `admin.fikes@uis.ac.id`).
   Login aplikasi memakai akun ini.

> Di mode Firebase, peran diambil dari **custom claims** akun (bukan sakelar).
> Sakelar Admin/Petugas hanya muncul di mode demo.

## Kelola pengguna (Admin) — server-side

Manajemen akun berjalan lewat **API routes** (`src/app/api/users/…`) memakai
Firebase Admin SDK, karena buat-akun & reset-password tanpa email tidak bisa
dilakukan dari browser secara aman. Setiap route memverifikasi ID token pemanggil
dan menuntut **custom claim `admin: true`**.

| Endpoint | Fungsi |
|---|---|
| `GET /api/users` | Daftar akun (admin) |
| `POST /api/users` | Buat akun + password + peran (+ prodi) |
| `POST /api/users/[uid]/password` | Set password baru **tanpa email** |
| `POST /api/users/[uid]/disable` | Aktif/nonaktifkan akun |

Layar **Pengguna & Periode** memakai endpoint ini (tombol **+ Akun**, **Reset
PW**, **Nonaktifkan** per baris) — hanya terlihat & berfungsi untuk admin.

### Kredensial server (Admin SDK)

- **Lokal:** otomatis membaca `.secrets/serviceAccountKey.json`.
- **Vercel:** set env var **`FIREBASE_SERVICE_ACCOUNT`** = isi JSON service account
  (satu baris). Ini **server-only**, bukan `NEXT_PUBLIC_`.

### Jadikan seseorang admin (bootstrap)

Custom claim admin diberikan lewat API `POST /api/users` (oleh admin lain), atau
untuk admin pertama:

```bash
node scripts/set-admin.mjs <email> "Nama Lengkap"
```

Pengguna harus **logout & login ulang** (atau token di-refresh otomatis oleh app)
agar klaim baru termuat.

## Impor massal master data (Excel)

Master data (prodi, dosen, ruangan, mata kuliah, kelas) dibaca **live dari
Firestore** (`useAppData` subscribe tiap koleksi; warna prodi dari palet client).
Admin mengisinya secara massal lewat **template Excel** — layar **Master Data →
Impor Massal**:

1. **Unduh Template** (`GET /api/master/template`) — satu `.xlsx`, sheet:
   Petunjuk, Prodi, Dosen, Ruangan, MataKuliah, Kelas.
2. Isi di Excel, lalu **Unggah Excel** — app memvalidasi (dry-run) dan menampilkan
   laporan per baris.
3. **Konfirmasi Impor** — hanya jika **0 error** (aturan "tolak semua sampai
   bersih"). Penulisan bersifat **upsert** per kunci natural (kode/NIDN/rombel);
   kolom `aktif` (TRUE/FALSE) = soft-delete.

Validasi (`src/lib/masterSchema.ts`): field wajib, tipe angka (SKS>0, semester),
jenjang S1/S2, **referensi prodi** (MK/Kelas → kode prodi yang ada), dan duplikat
kunci dalam file. Parsing/penulisan Excel di `src/lib/xlsxMaster.ts` +
`POST /api/master/import` (Admin SDK, admin-only).

## Periode akademik (F1)

- **Pemilih periode** di bilah atas: pilih periode lama untuk melihat jadwalnya
  **read-only** (badge kuning, tombol "+ Jadwal" & edit/hapus disembunyikan) —
  tetap bisa diekspor. Jadwal disubscribe per periode terpilih.
- **Kelola periode** (admin, layar Pengguna & Periode): **+ Periode** (nama +
  tanggal mulai/selesai, `POST /api/periode`) dan **Aktifkan**
  (`POST /api/periode/[id]/activate`) — transaksi menjamin hanya **satu periode
  aktif**.

## Membersihkan data contoh (sebelum go-live)

Data demo (dosen d1–d8, MK, ruangan, kelas, 18 jadwal) masih ada bercampur data
asli. Hapus HANYA data contoh (tidak menyentuh hasil impor Anda):

```bash
node scripts/clear-demo.mjs        # lihat dulu (dry-run)
node scripts/clear-demo.mjs --yes  # hapus
```

Prodi, periode, dan users dibiarkan. Setelah itu isi master via impor Excel.

## Arsitektur mesin validasi (PRD §F4)

Sesuai strategi PRD, **seluruh pengecekan bentrok berjalan di client**. Volume
data kecil (ratusan entri/periode), jadi seluruh jadwal periode aktif dimuat
sekali dan divalidasi secara aritmetika (jam disimpan sebagai menit integer).

| Kode | Aturan | Jenis |
|---|---|---|
| C1 | Bentrok dosen (termasuk sesi online) | Hard block |
| C2 | Bentrok kelas (termasuk sesi online) | Hard block |
| C3 | Bentrok ruangan (kedua entri offline) | Hard block |
| W1 | >3 sesi bersambung per dosen per hari | Warning (override) |
| W2 | Total SKS efektif dosen > 16 | Warning (override) |

Definisi overlap: `hari sama && aMulai < bSelesai && bMulai < aSelesai`.
Saat edit, entri itu sendiri dikecualikan dari pembanding.

Konstanta A1–A4 (jam operasional, hari, menit/SKS, batas SKS) terpusat di
[`src/lib/config.ts`](src/lib/config.ts) agar mudah diubah.

## Struktur

```
src/
  app/            layout, globals, page (App Router)
  components/     Login, App (shell), GridMingguan, FormJadwal, CariSlot,
                  RekapBeban, MasterData, Ekspor, UsersPeriode, primitives
  hooks/
    useAppData    sumber data (Firestore onSnapshot / seed demo) + mutasi jadwal
  lib/
    types         model data (PRD §6)
    config        konstanta A1–A4
    seed          data contoh
    catalog       lookup + enrich (jamSelesai, sksEff, prodiId)
    validation    mesin bentrok C1–C3 / W1–W2 (PRD §F4)
    slot          cari slot kosong (PRD §F6)
    exporter      ekspor PDF (print) & Excel (.xls) per prodi/dosen/ruangan
    firebase      init + deteksi mode demo
    time, ui      util waktu & style bersama
firestore.rules   security rules (PRD §6) — otorisasi tulis
```

## Cakupan fitur

- ✅ F1 Periode akademik (indikator periode aktif; data periode)
- ✅ F2 Master data (dosen, ruangan, mata kuliah, kelas, prodi)
- ✅ F3 Form jadwal — durasi otomatis dari SKS, team teaching, mode offline/online
- ✅ F4 Mesin validasi bentrok C1–C3 (hard block) + W1–W2 (warning + log override)
- ✅ F5 Grid mingguan + filter per prodi / dosen / ruangan / kelas + panel detail
- ✅ F6 Cari slot kosong
- ✅ F7 Ekspor PDF/Excel per prodi / dosen / ruangan
- ✅ F8 Rekap beban dosen

### Catatan lanjutan

- CRUD master data & pengguna/periode saat ini tampil read-friendly; tombol
  Tambah/Edit form entri master adalah langkah berikutnya (Firestore write sudah
  dijaga `firestore.rules`).
- Ekspor Excel memakai format tabel HTML (`.xls`) yang dibuka Excel; dapat
  ditingkatkan ke `exceljs` bila perlu styling sel lanjutan. Ekspor PDF memakai
  dialog cetak browser.
