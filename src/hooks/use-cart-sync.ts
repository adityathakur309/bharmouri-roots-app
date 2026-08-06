"use client";

import { useEffect, useRef } from "react";
import { cartApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { isBuyNowActive } from "@/lib/cart/buy-now";
import type { Product } from "@/types/product";

function mapApiCartItem(item: { product: Product; quantity: number }): CartItem {
  return { product: item.product, quantity: item.quantity };
}

export function useCartSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const synced = useRef(false);
  const setFromServer = useCartStore((s) => s.setFromServer);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || user?.role === "admin") {
      synced.current = false;
      if (user?.role === "admin") {
        useCartStore.getState().clearCart();
      }
      return;
    }

    if (synced.current) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await cartApi.get();
        const data = res.data as {
          items: CartItem[];
          couponCode?: string;
          couponDiscount?: number;
        };
        if (!cancelled) {
          // Don't overwrite an in-progress Buy Now checkout with the old server cart.
          if (isBuyNowActive()) {
            synced.current = true;
            return;
          }
          setFromServer({
            items: (data.items ?? []).map(mapApiCartItem),
            couponCode: data.couponCode ?? "",
            couponDiscount: data.couponDiscount ?? 0,
          });
        }
      } catch {
        /* empty cart until user adds items */
      } finally {
        synced.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, user?.role, setFromServer]);
}
