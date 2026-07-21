import { NextResponse, type NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UserRow {
  uid: string;
  email: string | null;
  nama: string;
  peran: "admin" | "petugas";
  prodiId: string | null;
  aktif: boolean;
}

/** GET /api/users — daftar seluruh akun (admin saja). */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const list = await adminAuth().listUsers(1000);
    const docs = await adminDb().collection("users").get();
    const profiles = new Map(docs.docs.map((d) => [d.id, d.data()]));

    const rows: UserRow[] = list.users.map((u) => {
      const p = profiles.get(u.uid) || {};
      const claims = u.customClaims || {};
      return {
        uid: u.uid,
        email: u.email ?? null,
        nama: (p.nama as string) || u.displayName || u.email || "(tanpa nama)",
        peran: (claims.admin ? "admin" : (p.peran as string) || "petugas") as
          | "admin"
          | "petugas",
        prodiId: (claims.prodiId as string) ?? (p.prodiId as string) ?? null,
        aktif: !u.disabled,
      };
    });
    rows.sort((a, b) => a.nama.localeCompare(b.nama));
    return NextResponse.json({ users: rows });
  } catch (e) {
    return handle(e);
  }
}

/** POST /api/users — buat akun baru dengan password (admin saja). */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const nama = String(body.nama || "").trim();
    const peran: "admin" | "petugas" = body.peran === "admin" ? "admin" : "petugas";
    const prodiId = peran === "petugas" ? String(body.prodiId || "").trim() : null;

    if (!email || !password) throw new ApiError(400, "Email dan password wajib diisi.");
    if (password.length < 6) throw new ApiError(400, "Password minimal 6 karakter.");
    if (!nama) throw new ApiError(400, "Nama wajib diisi.");
    if (peran === "petugas" && !prodiId)
      throw new ApiError(400, "Petugas wajib memiliki prodi.");

    const user = await adminAuth().createUser({
      email,
      password,
      displayName: nama,
    });
    await adminAuth().setCustomUserClaims(user.uid, {
      admin: peran === "admin",
      peran,
      prodiId,
    });
    await adminDb()
      .collection("users")
      .doc(user.uid)
      .set({ email, nama, peran, prodiId, aktif: true });

    return NextResponse.json({ uid: user.uid, email, nama, peran, prodiId, aktif: true });
  } catch (e) {
    return handle(e);
  }
}

function handle(e: unknown) {
  if (e instanceof ApiError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  const msg = e instanceof Error ? e.message : "Kesalahan server.";
  // Pesan Firebase Auth umum → ramah pengguna.
  if (msg.includes("email-already-exists"))
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  if (msg.includes("invalid-email"))
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  console.error("API /users:", msg);
  return NextResponse.json({ error: msg }, { status: 500 });
}
