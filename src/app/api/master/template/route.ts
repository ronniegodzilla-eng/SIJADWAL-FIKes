import { type NextRequest } from "next/server";
import { requireAdmin, ApiError } from "@/lib/apiAuth";
import { buildTemplate } from "@/lib/xlsxMaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/master/template — unduh template Excel master data (admin). */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const buf = await buildTemplate();
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-master-sijadwal.xlsx"',
      },
    });
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500;
    const msg = e instanceof Error ? e.message : "Kesalahan server.";
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
