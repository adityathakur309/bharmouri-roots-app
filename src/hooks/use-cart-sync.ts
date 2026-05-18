"use client";

import { useEffect, useRef } from "react";
import { cartApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { isValidMongoId } from "@/lib/utils/mongo-id";
import type { Product } from "@/types/product";

function mapApiCartItem(item: { product: Product; quantity: number }): CartItem {
  return { product: item.product, quantity: item.quantity };
}

export function useCartSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const synced = useRef(false);
  const setFromServer = useCartStore((s) => s.setFromServer);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      synced.current = false;
      return;
    }

    if (synced.current) return;

    let cancelled = false;

    (async () => {
      const localItems = useCartStore.getState().items;

      for (const item of localItems) {
        if (!isValidMongoId(item.product.id)) continue;
        try {
          await cartApi.addItem(item.product.id, item.quantity);
        } catch {
          /* item may be invalid or out of stock */
        }
      }

      try {
        const res = await cartApi.get();
        const data = res.data as {
          items: CartItem[];
          couponCode?: string;
          couponDiscount?: number;
        };
        if (!cancelled) {
          setFromServer({
            items: (data.items ?? []).map(mapApiCartItem),
            couponCode: data.couponCode ?? "",
            couponDiscount: data.couponDiscount ?? 0,
          });
        }
      } catch {
        /* keep merged local cart */
      } finally {
        synced.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, setFromServer]);
}
