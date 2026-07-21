import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";
import { isMasterCollection, validateAndBuild, MASTER_SPEC } from "@/lib/masterCrud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function prodiIdSet() {
  const snap = await adminDb().collection("prodi").get();
  return new Set(snap.docs.map((d) => d.id));
}

/**
 * PATCH /api/master/[collection]/[id] — update satu record (admin).
 * Kunci natural (id) tetap. Body boleh sebagian (mis. { aktif:false } untuk
 * nonaktifkan); divalidasi terhadap gabungan data lama + baru.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { collection: string; id: string } }
) {
  try {
    await requireAdmin(req);
    const col = params.collection;
    if (!isMasterCollection(col)) throw new ApiError(404, "Koleksi tidak dikenal.");

    const ref = adminDb().collection(col).doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, "Data tidak ditemukan.");

    const patch = await req.json();
    // Gabungkan agar validasi record penuh; kunci natural dari data lama.
    const spec = MASTER_SPEC[col];
    const merged = { ...snap.data(), ...patch, [spec.naturalKey]: snap.data()![spec.naturalKey] };
    const { errors, data } = validateAndBuild(col, merged, await prodiIdSet());
    if (errors.length) return NextResponse.json({ errors }, { status: 400 });

    await ref.set(data, { merge: false });
    return NextResponse.json({ id: params.id, ...data });
  } catch (e) {
    return handle(e);
  }
}

/** DELETE /api/master/[collection]/[id] — hapus permanen satu record (admin). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { collection: string; id: string } }
) {
  try {
    await requireAdmin(req);
    const col = params.collection;
    if (!isMasterCollection(col)) throw new ApiError(404, "Koleksi tidak dikenal.");
    await adminDb().collection(col).doc(params.id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handle(e);
  }
}

function handle(e: unknown) {
  if (e instanceof ApiError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  const msg = e instanceof Error ? e.message : "Kesalahan server.";
  console.error("API master CRUD:", msg);
  return NextResponse.json({ error: msg }, { status: 500 });
}
