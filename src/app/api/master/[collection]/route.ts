import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";
import { isMasterCollection, validateAndBuild } from "@/lib/masterCrud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function prodiIdSet() {
  const snap = await adminDb().collection("prodi").get();
  return new Set(snap.docs.map((d) => d.id));
}

/** POST /api/master/[collection] — buat satu record master (admin). */
export async function POST(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    await requireAdmin(req);
    const col = params.collection;
    if (!isMasterCollection(col)) throw new ApiError(404, "Koleksi tidak dikenal.");

    const raw = await req.json();
    const { errors, data, id } = validateAndBuild(col, raw, await prodiIdSet());
    if (errors.length) return NextResponse.json({ errors }, { status: 400 });

    const ref = adminDb().collection(col).doc(id);
    if ((await ref.get()).exists)
      throw new ApiError(409, "Data dengan kode/kunci itu sudah ada.");

    await ref.set(data);
    return NextResponse.json({ id, ...data });
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
