import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/periode/[id]/activate — jadikan periode ini satu-satunya yang aktif.
 * Transaksi: nonaktifkan semua yang aktif, aktifkan yang dipilih (admin).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);
    const db = adminDb();
    const col = db.collection("periode");

    await db.runTransaction(async (tx) => {
      const target = col.doc(params.id);
      const targetDoc = await tx.get(target);
      if (!targetDoc.exists) throw new ApiError(404, "Periode tidak ditemukan.");
      const activeSnap = await tx.get(col.where("aktif", "==", true));
      activeSnap.docs.forEach((d) => {
        if (d.id !== params.id) tx.update(d.ref, { aktif: false });
      });
      tx.update(target, { aktif: true });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    const msg = e instanceof Error ? e.message : "Kesalahan server.";
    console.error("API periode/activate:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
