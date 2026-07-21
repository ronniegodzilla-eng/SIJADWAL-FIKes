import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/users/[uid]/password — set password baru langsung, tanpa email. */
export async function POST(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    await requireAdmin(req);
    const { password } = await req.json();
    const pw = String(password || "");
    if (pw.length < 6) throw new ApiError(400, "Password minimal 6 karakter.");
    await adminAuth().updateUser(params.uid, { password: pw });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    const msg = e instanceof Error ? e.message : "Kesalahan server.";
    console.error("API reset-password:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
