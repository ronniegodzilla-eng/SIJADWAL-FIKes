import "server-only";

import { existsSync, readFileSync } from "node:fs";
import {
  initializeApp,
  getApps,
  getApp,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Muat service account (server-only). Urutan:
 *  1. env FIREBASE_SERVICE_ACCOUNT (JSON string) — dipakai di Vercel.
 *  2. env GOOGLE_APPLICATION_CREDENTIALS (path file).
 *  3. .secrets/serviceAccountKey.json (fallback dev lokal).
 */
function loadServiceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      return JSON.parse(inline) as ServiceAccount;
    } catch {
      console.error("FIREBASE_SERVICE_ACCOUNT bukan JSON valid.");
    }
  }
  const path =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || ".secrets/serviceAccountKey.json";
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
  }
  return null;
}

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApp();
    return adminApp;
  }
  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error(
      "Service account tidak ditemukan. Set FIREBASE_SERVICE_ACCOUNT (Vercel) atau sediakan .secrets/serviceAccountKey.json (lokal)."
    );
  }
  adminApp = initializeApp({ credential: cert(sa) });
  return adminApp;
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
