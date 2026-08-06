"use client";

import { useEffect } from "react";
import { useCategoriesStore } from "@/stores/categories-store";

/** Shared categories for navbar / home / shop — one network request app-wide. */
export function useCategories() {
  const categories = useCategoriesStore((s) => s.categories);
  const loaded = useCategoriesStore((s) => s.loaded);
  const loading = useCategoriesStore((s) => s.loading);
  const ensureLoaded = useCategoriesStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  return { categories, loaded, loading };
}
