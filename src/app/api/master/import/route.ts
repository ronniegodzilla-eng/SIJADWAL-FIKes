import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin, ApiError } from "@/lib/apiAuth";
import { parseWorkbook } from "@/lib/xlsxMaster";
import { validateWorkbook } from "@/lib/masterSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_LIMIT = 400;

/**
 * POST /api/master/import — impor master data dari Excel (admin).
 * Query ?dryRun=1 → hanya validasi (laporan), tidak menulis.
 * Tanpa dryRun → tulis (upsert) hanya jika 0 error ("tolak semua sampai bersih").
 * Body: file .xlsx mentah (ArrayBuffer).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) throw new ApiError(400, "File kosong.");

    let sheets;
    try {
      sheets = await parseWorkbook(buf);
    } catch {
      throw new ApiError(400, "File tidak dapat dibaca sebagai Excel (.xlsx).");
    }

    // Kode prodi yang sudah ada di Firestore (untuk validasi referensi).
    const prodiSnap = await adminDb().collection("prodi").get();
    const existing = new Set<string>(
      prodiSnap.docs
        .map((d) => (d.data().kode as string) || "")
        .filter(Boolean)
        .map((k) => k.toUpperCase())
    );

    const { errors, docs, counts } = validateWorkbook(sheets, existing);

    if (dryRun || errors.length > 0) {
      return NextResponse.json({
        ok: errors.length === 0,
        dryRun: true,
        errors,
        counts,
        totalDocs: docs.length,
      });
    }

    // Commit — upsert batch (chunk agar di bawah limit).
    const db = adminDb();
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const d of docs.slice(i, i + BATCH_LIMIT)) {
        batch.set(db.collection(d.collection).doc(d.id), d.data, { merge: true });
      }
      await batch.commit();
    }

    return NextResponse.json({ ok: true, imported: docs.length, counts });
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    const msg = e instanceof Error ? e.message : "Kesalahan server.";
    console.error("API master/import:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
