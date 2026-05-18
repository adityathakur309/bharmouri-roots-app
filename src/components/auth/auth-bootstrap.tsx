"use client";

import { useEffect } from "react";
import { authApi } from "@/services/api";
import { getStoredToken, setAuthCookie, setStoredToken } from "@/services/api/client";
import { useAuthStore } from "@/stores/auth-store";

/** Restore JWT session from storage on app load (client-only). */
export function AuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = getStoredToken();
      if (!token) {
        clearSession();
        if (!cancelled) setHydrated(true);
        return;
      }

      setAuthCookie(token);

      try {
        const res = await authApi.getProfile();
        if (!cancelled) setSession(res.data);
      } catch {
        setStoredToken(null);
        clearSession();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, clearSession, setHydrated]);

  return null;
}
