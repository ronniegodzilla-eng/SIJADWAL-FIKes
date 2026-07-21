// Helper: muat service account & sediakan access token + fetch ber-otorisasi,
// memakai kredensial firebase-admin (menghindari dependensi google-auth-library
// tambahan yang menimbulkan konflik jose/jwks-rsa).

import { readFileSync } from "node:fs";
import { cert } from "firebase-admin/app";

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || ".secrets/serviceAccountKey.json";

export const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
export const projectId = serviceAccount.project_id;

const credential = cert(serviceAccount);

export async function accessToken() {
  const t = await credential.getAccessToken();
  return t.access_token;
}

/** fetch dengan Bearer token; lempar error berisi pesan API bila gagal. */
export async function apiFetch(url, init = {}) {
  const token = await accessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}
