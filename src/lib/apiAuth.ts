import "server-only";

import type { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Ambil & verifikasi ID token dari header Authorization: Bearer <token>. */
export async function verifyCaller(req: NextRequest): Promise<DecodedIdToken> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) throw new ApiError(401, "Token tidak ada.");
  try {
    return await adminAuth().verifyIdToken(match[1]);
  } catch {
    throw new ApiError(401, "Token tidak valid.");
  }
}

/** Pastikan pemanggil adalah admin (custom claim admin == true). */
export async function requireAdmin(req: NextRequest): Promise<DecodedIdToken> {
  const decoded = await verifyCaller(req);
  if (decoded.admin !== true) {
    throw new ApiError(403, "Hanya Admin Fakultas yang boleh mengakses ini.");
  }
  return decoded;
}
