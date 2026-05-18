import { create } from "zustand";
import type { Product } from "@/types/product";

interface WishlistStore {
  items: Product[];
  setItems: (products: Product[]) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],

  setItems: (products) => set({ items: products }),

  addItem: (product) => {
    if (!get().isWishlisted(product.id)) {
      set((state) => ({ items: [...state.items, product] }));
    }
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((p) => p.id !== productId),
    }));
  },

  toggleItem: (product) => {
    if (get().isWishlisted(product.id)) {
      get().removeItem(product.id);
    } else {
      get().addItem(product);
    }
  },

  isWishlisted: (productId) => {
    return get().items.some((p) => p.id === productId);
  },

  clearWishlist: () => set({ items: [] }),
}));
