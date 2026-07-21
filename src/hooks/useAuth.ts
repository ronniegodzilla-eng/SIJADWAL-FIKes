"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase";

export interface RoleClaims {
  admin: boolean;
  peran: "admin" | "petugas";
  prodiId: string | null;
}

/**
 * Status autentikasi + peran (custom claims).
 * Mode Firebase memakai onAuthStateChanged & getIdTokenResult; mode demo
 * memakai flag lokal (klik Masuk) tanpa peran (peran diatur sakelar UI).
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<RoleClaims | null>(null);
  const [demoLoggedIn, setDemoLoggedIn] = useState(false);
  const [ready, setReady] = useState(!firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled || !auth) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      unsub = onAuthStateChanged(auth!, async (u) => {
        setUser(u);
        if (u) {
          // force refresh agar custom claim terbaru (mis. admin) ikut termuat.
          const res = await u.getIdTokenResult(true);
          const c = res.claims;
          setClaims({
            admin: c.admin === true,
            peran: (c.peran as "admin" | "petugas") || (c.admin ? "admin" : "petugas"),
            prodiId: (c.prodiId as string) ?? null,
          });
        } else {
          setClaims(null);
        }
        setReady(true);
      });
    })();
    return () => unsub?.();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (firebaseEnabled && auth) {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
      return; // authed & claims di-set oleh onAuthStateChanged
    }
    setDemoLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    if (firebaseEnabled && auth) {
      const { signOut } = await import("firebase/auth");
      await signOut(auth).catch(() => {});
    }
    setDemoLoggedIn(false);
  }, []);

  /** ID token untuk header Authorization ke API routes. */
  const getToken = useCallback(async (): Promise<string | null> => {
    if (firebaseEnabled && auth?.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  }, []);

  const authed = firebaseEnabled ? !!user : demoLoggedIn;

  return {
    authed,
    ready,
    email: firebaseEnabled ? user?.email ?? null : null,
    claims,
    login,
    logout,
    getToken,
    firebaseEnabled,
  };
}
