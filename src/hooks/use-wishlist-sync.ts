"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useWishlist } from "@/hooks/use-wishlist";

export function useWishlistSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const synced = useRef(false);
  const { syncWishlist } = useWishlist();

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || user?.role === "admin") {
      synced.current = false;
      if (user?.role === "admin") {
        useWishlistStore.getState().clearWishlist();
      }
      return;
    }

    if (synced.current) return;

    let cancelled = false;

    (async () => {
      await syncWishlist();
      if (!cancelled) synced.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, user?.role, syncWishlist]);
}
