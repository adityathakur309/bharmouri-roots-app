"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { cartApi } from "@/services/api";
import { useCartStore } from "@/stores/cart-store";
import { pushLocalCartToServer } from "@/lib/cart/sync-server-cart";
import {
  clearBuyNowIntent,
  getBuyNowIntent,
  isBuyNowActive,
  saveBuyNowIntent,
} from "@/lib/cart/buy-now";
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

  const setLocalCartItems = useCallback(
    (next: {
      items: { product: Product; quantity: number }[];
      couponCode?: string;
      couponDiscount?: number;
    }) => {
      useCartStore.getState().setFromServer({
        items: next.items,
        couponCode: next.couponCode ?? "",
        couponDiscount: next.couponDiscount ?? 0,
      });
    },
    []
  );

  const replaceServerCart = useCallback(
    async (nextItems: { product: Product; quantity: number }[]) => {
      if (!isLoggedIn) return { synced: 0, skipped: 0 };
      await cartApi.clear();
      let synced = 0;
      let skipped = 0;
      for (const item of nextItems) {
        if (!isValidMongoId(item.product.id)) {
          skipped += item.quantity;
          continue;
        }
        try {
          await cartApi.addItem(item.product.id, item.quantity);
          synced += item.quantity;
        } catch {
          skipped += item.quantity;
        }
      }
      await syncCart();
      return { synced, skipped };
    },
    [isLoggedIn, syncCart]
  );

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

  /** Swap cart to a single product for direct checkout. Previous cart is restored if checkout is abandoned. */
  const beginBuyNow = useCallback(
    async (product: Product, quantity = 1) => {
      const state = useCartStore.getState();
      saveBuyNowIntent({
        product,
        quantity,
        snapshot: {
          items: state.items,
          couponCode: state.couponCode,
          couponDiscount: state.couponDiscount,
        },
      });

      // Guests only store intent; cart is applied after login on /checkout.
      if (!isLoggedIn) return;

      const buyNowItems = [{ product, quantity }];
      setLocalCartItems({ items: buyNowItems });

      try {
        await replaceServerCart(buyNowItems);
        setLocalCartItems({ items: buyNowItems });
      } catch {
        /* local buy-now cart kept */
      }
    },
    [isLoggedIn, replaceServerCart, setLocalCartItems]
  );

  /** Re-apply stored Buy Now cart (e.g. after login / cart sync). */
  const applyBuyNowIfPending = useCallback(async () => {
    const intent = getBuyNowIntent();
    if (!intent) return false;

    const buyNowItems = [{ product: intent.product, quantity: intent.quantity }];
    setLocalCartItems({ items: buyNowItems });

    if (isLoggedIn) {
      try {
        await replaceServerCart(buyNowItems);
        setLocalCartItems({ items: buyNowItems });
      } catch {
        /* local kept */
      }
    }
    return true;
  }, [isLoggedIn, replaceServerCart, setLocalCartItems]);

  /** Restore pre–Buy Now cart when leaving checkout without placing an order. */
  const abandonBuyNow = useCallback(async () => {
    const intent = getBuyNowIntent();
    if (!intent) return;

    clearBuyNowIntent();
    setLocalCartItems({
      items: intent.snapshot.items,
      couponCode: intent.snapshot.couponCode,
      couponDiscount: intent.snapshot.couponDiscount,
    });

    if (!isLoggedIn) return;

    try {
      await replaceServerCart(intent.snapshot.items);
      if (intent.snapshot.couponCode) {
        try {
          await cartApi.applyCoupon(intent.snapshot.couponCode);
          await syncCart();
        } catch {
          /* coupon restore best-effort */
        }
      }
      setLocalCartItems({
        items: intent.snapshot.items,
        couponCode: intent.snapshot.couponCode,
        couponDiscount: intent.snapshot.couponDiscount,
      });
    } catch {
      /* local restored already */
    }
  }, [isLoggedIn, replaceServerCart, setLocalCartItems, syncCart]);

  /** After a successful Buy Now order — cart stays cleared. */
  const completeBuyNow = useCallback(() => {
    clearBuyNowIntent();
  }, []);

  const prepareCheckoutCart = useCallback(async () => {
    if (!isLoggedIn) {
      return { ok: false as const, reason: "login" as const };
    }

    // Buy Now must replace the server cart (not merge) so only that product is ordered.
    if (isBuyNowActive()) {
      const localItems = useCartStore.getState().items;
      const { synced, skipped } = await replaceServerCart(localItems);
      const serverItems = useCartStore.getState().items;
      if (serverItems.length === 0) {
        return {
          ok: false as const,
          reason: skipped > 0 ? ("invalid-products" as const) : ("empty" as const),
        };
      }
      return { ok: true as const, synced, skipped };
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
  }, [isLoggedIn, replaceServerCart]);

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
    beginBuyNow,
    applyBuyNowIfPending,
    abandonBuyNow,
    completeBuyNow,
    prepareCheckoutCart,
    getSubtotal,
    getTotal,
    getItemCount,
  };
}
