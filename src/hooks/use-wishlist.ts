"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { wishlistApi } from "@/services/api";
import { useWishlistStore } from "@/stores/wishlist-store";
import { isValidMongoId } from "@/lib/utils/mongo-id";
import type { Product } from "@/types/product";

type WishlistApiItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  rating: number;
};

function toProduct(item: WishlistApiItem): Product {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    category: "",
    categorySlug: "",
    price: item.price,
    rating: item.rating,
    reviews: 0,
    stock: item.stock,
    images: item.images,
    description: "",
    shortDescription: "",
    features: [],
    origin: "",
  };
}

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = hydrated && isAuthenticated;

  const items = useWishlistStore((s) => s.items);

  const syncWishlist = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await wishlistApi.get();
      const data = (res.data ?? []) as WishlistApiItem[];
      useWishlistStore.getState().setItems(data.map(toProduct));
    } catch {
      /* keep in-memory wishlist for this session */
    }
  }, [isLoggedIn]);

  const toggleItem = useCallback(
    async (product: Product) => {
      useWishlistStore.getState().toggleItem(product);

      if (!isLoggedIn || !isValidMongoId(product.id)) return;

      try {
        await wishlistApi.toggle(product.id);
        await syncWishlist();
      } catch {
        useWishlistStore.getState().toggleItem(product);
      }
    },
    [isLoggedIn, syncWishlist]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const product = useWishlistStore.getState().items.find((p) => p.id === productId);
      useWishlistStore.getState().removeItem(productId);

      if (!isLoggedIn || !product || !isValidMongoId(productId)) return;

      try {
        await wishlistApi.toggle(productId);
        await syncWishlist();
      } catch {
        if (product) useWishlistStore.getState().addItem(product);
      }
    },
    [isLoggedIn, syncWishlist]
  );

  const isWishlisted = useCallback((productId: string) => {
    return useWishlistStore.getState().isWishlisted(productId);
  }, []);

  const clearWishlist = useCallback(() => {
    useWishlistStore.getState().clearWishlist();
  }, []);

  return {
    items,
    toggleItem,
    removeItem,
    isWishlisted,
    clearWishlist,
    syncWishlist,
  };
}
