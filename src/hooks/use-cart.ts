"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { cartApi } from "@/services/api";
import { useCartStore } from "@/stores/cart-store";
import { pushLocalCartToServer } from "@/lib/cart/sync-server-cart";
import { isValidMongoId } from "@/lib/utils/mongo-id";
import type { Product } from "@/types/product";

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = hydrated && isAuthenticated;

  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const syncCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await cartApi.get();
      const data = res.data as {
        items: { product: Product; quantity: number }[];
        couponCode?: string;
        couponDiscount?: number;
      };
      useCartStore.getState().setFromServer({
        items: data.items ?? [],
        couponCode: data.couponCode ?? "",
        couponDiscount: data.couponDiscount ?? 0,
      });
    } catch {
      /* keep local cart */
    }
  }, [isLoggedIn]);

  const addItem = useCallback(
    async (product: Product, quantity = 1) => {
      useCartStore.getState().addItem(product, quantity);

      if (!isLoggedIn) return;

      if (!isValidMongoId(product.id)) return;

      try {
        await cartApi.addItem(product.id, quantity);
        await syncCart();
      } catch {
        /* local state kept; server sync may fail for stale ids */
      }
    },
    [isLoggedIn, syncCart]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      useCartStore.getState().removeItem(productId);
      if (isLoggedIn && isValidMongoId(productId)) {
        try {
          await cartApi.updateItem(productId, 0);
          await syncCart();
        } catch {
          /* local state kept */
        }
      }
    },
    [isLoggedIn, syncCart]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      useCartStore.getState().updateQuantity(productId, quantity);
      if (isLoggedIn && isValidMongoId(productId)) {
        try {
          await cartApi.updateItem(productId, quantity);
          await syncCart();
        } catch {
          /* local state kept */
        }
      }
    },
    [isLoggedIn, syncCart]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      if (isLoggedIn) {
        try {
          await cartApi.applyCoupon(code);
          await syncCart();
          return true;
        } catch {
          return useCartStore.getState().applyCoupon(code);
        }
      }
      return useCartStore.getState().applyCoupon(code);
    },
    [isLoggedIn, syncCart]
  );

  const removeCoupon = useCallback(async () => {
    useCartStore.getState().removeCoupon();
    if (isLoggedIn) {
      try {
        await cartApi.removeCoupon();
        await syncCart();
      } catch {
        /* local state kept */
      }
    }
  }, [isLoggedIn, syncCart]);

  const clearCart = useCallback(async () => {
    useCartStore.getState().clearCart();
    if (isLoggedIn) {
      try {
        await cartApi.clear();
      } catch {
        /* local state kept */
      }
    }
  }, [isLoggedIn]);

  const prepareCheckoutCart = useCallback(async () => {
    if (!isLoggedIn) {
      return { ok: false as const, reason: "login" as const };
    }
    const { synced, skipped } = await pushLocalCartToServer();
    const serverItems = useCartStore.getState().items;
    if (serverItems.length === 0) {
      return {
        ok: false as const,
        reason: skipped > 0 ? ("invalid-products" as const) : ("empty" as const),
      };
    }
    return { ok: true as const, synced, skipped };
  }, [isLoggedIn]);

  return {
    items,
    couponCode,
    couponDiscount,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
    syncCart,
    prepareCheckoutCart,
    getSubtotal,
    getTotal,
    getItemCount,
  };
}
