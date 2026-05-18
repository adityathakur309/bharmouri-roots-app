import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export interface CartItem {
  product: Product;
  quantity: number;
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
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const VALID_COUPONS: Record<string, number> = {
  HIMALAYA10: 10,
  BHARMOUR15: 15,
  ORGANIC20: 20,
  WELCOME5: 5,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: "",
      couponDiscount: 0,

      setFromServer: (data) =>
        set({
          items: data.items,
          couponCode: data.couponCode,
          couponDiscount: data.couponDiscount,
        }),

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: "", couponDiscount: 0 }),

      applyCoupon: (code) => {
        const discount = VALID_COUPONS[code.toUpperCase()];
        if (discount) {
          set({ couponCode: code.toUpperCase(), couponDiscount: discount });
          return true;
        }
        return false;
      },

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
    }),
    { name: "bharmouriroots-cart" }
  )
);
