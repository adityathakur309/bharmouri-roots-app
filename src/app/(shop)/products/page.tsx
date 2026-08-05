"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown, Star, Grid3X3, List, Leaf } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categories as mockFallbackCategories } from "@/lib/mock-data";
import { categoryApi, productApi } from "@/services/api";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Rating", value: "rating" },
  { label: "Most Reviews", value: "reviews" },
];

const priceRanges = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹2,000", min: 1000, max: 2000 },
  { label: "₹2,000+", min: 2000, max: Infinity },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("featured");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") ?? "");
  }, [searchParams]);

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data ?? []))
      .catch(() =>
        setCategories(
          mockFallbackCategories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            icon: c.icon,
            image: c.image,
            sortOrder: 0,
            productCount: c.count,
          }))
        )
      );
  }, []);

  const applyCategory = useCallback(
    (slug: string) => {
      setSelectedCategory(slug);
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set("category", slug);
      else params.delete("category");
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const sortMap: Record<string, string | undefined> = {
      "price-asc": "price_asc",
      "price-desc": "price_desc",
      rating: "rating",
      newest: "newest",
    };
    setLoading(true);
    productApi
      .list({
        limit: 100,
        category: selectedCategory || undefined,
        search: search || undefined,
        sort: sortMap[sortBy],
      })
      .then((res) => {
        setCatalog(res.data ?? []);
      })
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false));
  }, [selectedCategory, search, sortBy]);

  const filtered = useMemo(() => {
    let result = [...catalog];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }
    if (selectedPriceRange !== null) {
      const range = priceRanges[selectedPriceRange];
      result = result.filter((p) => p.price >= range.min && p.price <= range.max);
    }
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "reviews": result.sort((a, b) => b.reviews - a.reviews); break;
      case "newest": result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      default: result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [catalog, search, selectedCategory, sortBy, selectedPriceRange, minRating]);

  const activeFiltersCount = [selectedCategory, selectedPriceRange !== null, minRating > 0].filter(Boolean).length;

  const clearFilters = () => {
    applyCategory("");
    setSelectedPriceRange(null);
    setMinRating(0);
    setSearch("");
  };

  const Sidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[hsl(var(--muted-foreground))]">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => applyCategory("")}
            className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left", !selectedCategory ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium" : "hover:bg-[hsl(var(--muted))]")}
          >
            <span>All Products</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => applyCategory(selectedCategory === cat.slug ? "" : cat.slug)}
              className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left", selectedCategory === cat.slug ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium" : "hover:bg-[hsl(var(--muted))]")}
            >
              <span className="flex items-center gap-2"><span>{cat.icon || "🏔️"}</span>{cat.name}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{cat.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[hsl(var(--muted-foreground))]">Price Range</h3>
        <div className="space-y-1">
          {priceRanges.map((range, i) => (
            <button
              key={range.label}
              onClick={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
              className={cn("w-full px-3 py-2 rounded-lg text-sm transition-colors text-left", selectedPriceRange === i ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium" : "hover:bg-[hsl(var(--muted))]")}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[hsl(var(--muted-foreground))]">Min Rating</h3>
        <div className="space-y-1">
          {[4.5, 4, 3.5, 0].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors", minRating === r && r > 0 ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium" : "hover:bg-[hsl(var(--muted))]")}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={cn("w-3 h-3", s <= r ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
                ))}
              </div>
              <span>{r > 0 ? `${r}+ stars` : "All ratings"}</span>
            </button>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <X className="w-3.5 h-3.5" /> Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="gradient-forest py-12 px-4">
        <div className="container mx-auto max-w-7xl text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Leaf className="w-8 h-8 mx-auto mb-3 text-[hsl(var(--accent))]" />
            <h1 className="text-3xl md:text-5xl font-bold mb-2">All Products</h1>
            <p className="text-white/70 text-lg">Organic, Authentic & Handcrafted from Himachal Pradesh</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        {/* Top bar */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-9 pr-4 py-2.5 sm:py-2 rounded-xl border bg-[hsl(var(--card))] text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                </button>
              )}
            </div>

            {/* Second row of controls (filters + sort + view) */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 lg:hidden"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="saffron" className="text-[10px] px-1.5 py-0">{activeFiltersCount}</Badge>
                )}
              </Button>

              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-[hsl(var(--muted-foreground))] hidden sm:inline">
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                </span>

                {/* Sort */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <span className="hidden sm:inline">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                    <span className="sm:hidden">Sort</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 bg-[hsl(var(--card))] border rounded-xl shadow-xl w-48 py-1 z-20"
                      >
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                            className={cn("w-full text-left px-4 py-2 text-sm hover:bg-[hsl(var(--muted))] transition-colors", sortBy === opt.value && "text-[hsl(var(--primary))] font-medium")}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View mode */}
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-[hsl(var(--primary))] text-white" : "hover:bg-[hsl(var(--muted))]")}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={cn("p-2 transition-colors", viewMode === "list" ? "bg-[hsl(var(--primary))] text-white" : "hover:bg-[hsl(var(--muted))]")}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(selectedCategory || selectedPriceRange !== null || minRating > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {categories.find((c) => c.slug === selectedCategory)?.name}
                <button onClick={() => applyCategory("")} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {selectedPriceRange !== null && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {priceRanges[selectedPriceRange].label}
                <button onClick={() => setSelectedPriceRange(null)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {minRating > 0 && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {minRating}+ stars
                <button onClick={() => setMinRating(0)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-[hsl(var(--card))] rounded-2xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <Badge variant="saffron" className="text-[10px]">{activeFiltersCount}</Badge>
                )}
              </div>
              <Sidebar />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  className="absolute left-0 top-0 bottom-0 w-72 bg-[hsl(var(--background))] overflow-y-auto p-5"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg">Filters</h2>
                    <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <Sidebar />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {!loading && catalog.length === 0 ? (
              <EmptyState
                title="Products coming soon"
                description="No products are available yet. Please check back soon."
                primaryAction={{ label: "Browse Home", href: "/" }}
                className="py-12"
              />
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <span className="text-6xl mb-4 block">🔍</span>
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-[hsl(var(--muted-foreground))] mb-4">Try adjusting your filters or search query</p>
                <Button onClick={clearFilters} variant="outline">Clear All Filters</Button>
              </motion.div>
            ) : (
              <motion.div
                layout
                className={cn(
                  "grid gap-3 sm:gap-5",
                  viewMode === "grid"
                    ? "grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
