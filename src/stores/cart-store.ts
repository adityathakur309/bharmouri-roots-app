import { create } from "zustand";
import type { Product } from "@/types/product";

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

interface CartStore {
  items: CartItem[];
  couponCode: string;
  couponDiscount: number;
  setFromServer: (data: {
    items: CartItem[];
    couponCode: string;
    couponDiscount: number;
  }) => void;
  addItem: (product: Product, quantity?: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  /** Guest-only optimistic apply is disabled — coupons require server validation. */
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

function lineKey(productId: string, variantId?: string) {
  return `${productId}::${variantId ?? ""}`;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  couponCode: "",
  couponDiscount: 0,

  setFromServer: (data) =>
    set({
      items: data.items,
      couponCode: data.couponCode,
      couponDiscount: data.couponDiscount,
    }),

  addItem: (product, quantity = 1, variantId) => {
    set((state) => {
      const key = lineKey(product.id, variantId);
      const existing = state.items.find(
        (i) => lineKey(i.product.id, i.variantId) === key
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            lineKey(i.product.id, i.variantId) === key
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { product, quantity, variantId },
        ],
      };
    });
  },

  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter(
        (i) => lineKey(i.product.id, i.variantId) !== lineKey(productId, variantId)
      ),
    }));
  },

  updateQuantity: (productId, quantity, variantId) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        lineKey(i.product.id, i.variantId) === lineKey(productId, variantId)
          ? { ...i, quantity }
          : i
      ),
    }));
  },

  clearCart: () => set({ items: [], couponCode: "", couponDiscount: 0 }),

  applyCoupon: () => false,

  removeCoupon: () => set({ couponCode: "", couponDiscount: 0 }),

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().couponDiscount;
    return subtotal - (subtotal * discount) / 100;
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
