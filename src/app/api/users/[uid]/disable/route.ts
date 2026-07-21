import { NextResponse, type NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/users/[uid]/disable — aktif/nonaktifkan akun (admin saja). */
export async function POST(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const caller = await requireAdmin(req);
    const { disabled } = await req.json();
    const flag = Boolean(disabled);
    if (caller.uid === params.uid && flag)
      throw new ApiError(400, "Tidak dapat menonaktifkan akun sendiri.");
    await adminAuth().updateUser(params.uid, { disabled: flag });
    await adminDb()
      .collection("users")
      .doc(params.uid)
      .set({ aktif: !flag }, { merge: true });
    return NextResponse.json({ ok: true, aktif: !flag });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    const msg = e instanceof Error ? e.message : "Kesalahan server.";
    console.error("API disable:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
