import { create } from "zustand";
import { categoryApi } from "@/services/api";
import { categories as mockFallbackCategories } from "@/lib/mock-data";
import type { Category } from "@/types/category";

function fallbackCategories(): Category[] {
  return mockFallbackCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    image: c.image,
    sortOrder: 0,
    productCount: c.count,
  }));
}

interface CategoriesStore {
  categories: Category[];
  loaded: boolean;
  loading: boolean;
  ensureLoaded: () => Promise<void>;
}

/** Shared in-flight promise so navbar + home + products hit GET /categories once. */
let inflight: Promise<void> | null = null;

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  loaded: false,
  loading: false,

  ensureLoaded: async () => {
    if (get().loaded) return;
    if (inflight) return inflight;

    set({ loading: true });

    inflight = categoryApi
      .list()
      .then((res) => {
        const list = res.data ?? [];
        set({
          categories: list.length ? list : fallbackCategories(),
          loaded: true,
          loading: false,
        });
      })
      .catch(() => {
        set({
          categories: fallbackCategories(),
          loaded: true,
          loading: false,
        });
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  },
}));
