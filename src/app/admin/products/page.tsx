"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { productApi } from "@/services/api";
import type { Product } from "@/types/product";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { useListViewMode } from "@/hooks/use-list-view-mode";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, Eye, Star, Package, Upload, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { normalizeProductImageUrl } from "@/lib/utils/image-url";
import { useToast } from "@/hooks/use-toast";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { viewMode, setViewMode } = useListViewMode();
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      const res = await productApi.adminList({ limit: 100 });
      setProducts(res.data ?? []);
      setLoadError(false);
    } catch {
      setProducts([]);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    // Initial admin list fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount/load
    void loadProducts();
  }, [loadProducts]);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.categorySlug)))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || p.categorySlug === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await productApi.remove(product.id);
      toast({ title: "Product removed" });
      loadProducts();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handlePublishToggle = async (product: Product) => {
    const next = !product.isActive;
    try {
      await productApi.update(product.id, { isActive: next });
      toast({
        title: next ? "Product published" : "Product unpublished",
        description: next
          ? "Visible on home and shop pages."
          : "Hidden from public storefront.",
      });
      loadProducts();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await productApi.removeAll();
      const count = res.data?.deactivated ?? 0;
      toast({
        title: "Products deactivated",
        description: `${count} product(s) unpublished from the storefront.`,
      });
      setDeleteAllOpen(false);
      await loadProducts();
    } catch {
      toast({ title: "Delete All failed", variant: "destructive" });
    } finally {
      setDeletingAll(false);
    }
  };

  const productActions = (product: Product) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={cn(
          "p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]",
          product.isActive ? "text-amber-600" : "text-green-600"
        )}
        title={product.isActive ? "Unpublish" : "Publish"}
        onClick={() => void handlePublishToggle(product)}
      >
        {product.isActive ? (
          <Archive className="w-3.5 h-3.5" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
      </button>
      {product.isActive ? (
        <Link href={`/products/${product.slug}`} target="_blank">
          <button className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]" title="View">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Link>
      ) : null}
      <button
        className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
        title="Edit"
        onClick={() => {
          setEditing(product);
          setDialogOpen(true);
        }}
      >
        <Edit className="w-3.5 h-3.5" />
      </button>
      <button
        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
        title="Delete"
        onClick={() => handleDelete(product)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <Button
            variant="outline"
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            onClick={() => setDeleteAllOpen(true)}
            disabled={products.length === 0}
          >
            <Trash2 className="w-4 h-4" /> Delete All
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {loadError ? (
        <EmptyState
          icon={Package}
          title="Could not load products"
          description="Check your database connection, then try again."
          primaryAction={{ label: "Retry", onClick: () => void loadProducts() }}
          secondaryAction={{ label: "Add Product", onClick: () => { setEditing(null); setDialogOpen(true); } }}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Your catalog is empty. Add your first product to start selling."
          primaryAction={{
            label: "Add Product",
            onClick: () => {
              setEditing(null);
              setDialogOpen(true);
            },
          }}
        />
      ) : null}

      {products.length > 0 && (
      <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-[hsl(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize",
                selectedCategory === cat
                  ? "gradient-forest text-white"
                  : "bg-[hsl(var(--card))] border hover:bg-[hsl(var(--muted))]"
              )}
            >
              {cat === "all" ? "All" : cat.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]/30 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Product</th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Category</th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Price</th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden md:table-cell">Rating</th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Stock</th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Status</th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filtered.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[hsl(var(--muted))]/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                          <img
                            src={normalizeProductImageUrl(product.images[0] ?? "")}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="min-w-0 max-w-[120px] sm:max-w-[200px] md:max-w-none">
                          <p className="font-medium line-clamp-1 truncate">{product.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{product.origin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--muted))] capitalize">
                        {product.categorySlug.replace("-", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[hsl(var(--primary))]">{formatPrice(product.price)}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          product.stock <= 10 ? "text-red-500" : product.stock <= 30 ? "text-amber-500" : "text-green-600"
                        )}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {product.isActive ? (
                          <Badge variant="green" className="text-[10px]">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                        )}
                        {product.isBestseller && (
                          <Badge variant="saffron" className="text-[10px]">Bestseller</Badge>
                        )}
                        {product.isNew && (
                          <Badge variant="green" className="text-[10px]">New</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{productActions(product)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--muted-foreground))]/40" />
              <p className="text-[hsl(var(--muted-foreground))]">No products match your filters</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[hsl(var(--muted))] overflow-hidden">
                  <img
                    src={normalizeProductImageUrl(product.images[0] ?? "")}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="min-w-0">
                    <p className="font-semibold line-clamp-2">{product.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5 capitalize">
                      {product.categorySlug.replace("-", " ")}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[hsl(var(--primary))]">{formatPrice(product.price)}</p>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        product.stock <= 10 ? "text-red-500" : product.stock <= 30 ? "text-amber-500" : "text-green-600"
                      )}
                    >
                      {product.stock} in stock
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.isActive ? (
                      <Badge variant="green" className="text-[10px]">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                    )}
                    {product.isBestseller && (
                      <Badge variant="saffron" className="text-[10px]">Bestseller</Badge>
                    )}
                    {product.isNew && (
                      <Badge variant="green" className="text-[10px]">New</Badge>
                    )}
                  </div>
                  <div className="mt-auto pt-1 border-t flex items-center justify-between">
                    {productActions(product)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 bg-[hsl(var(--card))] rounded-2xl border">
              <Package className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--muted-foreground))]/40" />
              <p className="text-[hsl(var(--muted-foreground))]">No products match your filters</p>
            </div>
          )}
        </>
      )}
      </>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSaved={loadProducts}
      />

      <Dialog open={deleteAllOpen} onOpenChange={(open) => !deletingAll && setDeleteAllOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete All Products</DialogTitle>
            <DialogDescription>
              This will unpublish/deactivate ALL active products from the storefront. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deletingAll}
              onClick={() => setDeleteAllOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingAll}
              onClick={() => void handleDeleteAll()}
            >
              {deletingAll ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
