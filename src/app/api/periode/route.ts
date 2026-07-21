import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";
import { slugId } from "@/lib/masterSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/periode — buat periode baru (admin). Nonaktif secara default. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const nama = String(body.nama || "").trim();
    const tanggalMulai = String(body.tanggalMulai || "").trim();
    const tanggalSelesai = String(body.tanggalSelesai || "").trim();

    if (!nama) throw new ApiError(400, "Nama periode wajib diisi.");
    if (!tanggalMulai || !tanggalSelesai)
      throw new ApiError(400, "Tanggal mulai & selesai wajib diisi.");
    if (tanggalMulai > tanggalSelesai)
      throw new ApiError(400, "Tanggal mulai tidak boleh setelah tanggal selesai.");

    const id = slugId(nama);
    const ref = adminDb().collection("periode").doc(id);
    if ((await ref.get()).exists)
      throw new ApiError(409, "Periode dengan nama itu sudah ada.");

    await ref.set({ nama, tanggalMulai, tanggalSelesai, aktif: false });
    return NextResponse.json({ id, nama, tanggalMulai, tanggalSelesai, aktif: false });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    const msg = e instanceof Error ? e.message : "Kesalahan server.";
    console.error("API periode:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
