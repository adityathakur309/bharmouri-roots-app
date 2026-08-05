"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { useListViewMode } from "@/hooks/use-list-view-mode";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import type { Product } from "@/types/product";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { viewMode, setViewMode } = useListViewMode();
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast({ title: "Added to cart!", description: product.name });
  };

  const handleRemove = (id: string) => {
    removeItem(id);
    toast({ title: "Removed from wishlist" });
    if (detailProduct?.id === id) setDetailProduct(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" /> My Wishlist
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {items.length > 0 && (
            <Button
              size="sm"
              onClick={() => {
                items.forEach((p) => addItem(p));
                toast({ title: "All items added to cart!" });
              }}
              className="gap-2 hidden sm:inline-flex"
            >
              <ShoppingCart className="w-4 h-4" /> Add All to Cart
            </Button>
          )}
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {items.length > 0 && (
        <Button
          size="sm"
          onClick={() => {
            items.forEach((p) => addItem(p));
            toast({ title: "All items added to cart!" });
          }}
          className="gap-2 w-full sm:hidden"
        >
          <ShoppingCart className="w-4 h-4" /> Add All to Cart
        </Button>
      )}

      {items.length === 0 ? (
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-16 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted-foreground))]/30" />
          <h3 className="font-bold mb-2">Your wishlist is empty</h3>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">Save products you love to your wishlist and find them here.</p>
          <Link href="/products">
            <Button className="gap-2"><ShoppingBag className="w-4 h-4" /> Explore Products</Button>
          </Link>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence>
            {items.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden group"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-[hsl(var(--muted))]">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="p-2.5 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] mb-0.5 line-clamp-1">{product.category}</p>
                  <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-1.5 sm:mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="font-bold text-sm text-[hsl(var(--primary))]">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                    <Button size="sm" className="flex-1 gap-1 text-xs sm:text-sm h-8 sm:h-9" onClick={() => handleAddToCart(product)}>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Cart</span>
                    </Button>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none h-8 sm:h-9 gap-1 text-xs"
                        onClick={() => setDetailProduct(product)}
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(product.id)}
                        className="w-8 sm:w-9 px-0 h-8 sm:h-9 text-red-500 hover:bg-red-50 hover:border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden divide-y">
          <AnimatePresence>
            {items.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3 sm:p-4"
              >
                <Link href={`/products/${product.slug}`} className="shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[hsl(var(--muted))]">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">{product.category}</p>
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-sm line-clamp-1 hover:text-[hsl(var(--primary))]">
                      {product.name}
                    </h3>
                  </Link>
                  <span className="font-bold text-sm text-[hsl(var(--primary))]">
                    {formatPrice(product.price)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" className="gap-1.5 h-8 sm:h-9" onClick={() => handleAddToCart(product)}>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(product.id)}
                    className="w-8 sm:w-9 px-0 h-8 sm:h-9 text-red-500 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!detailProduct} onOpenChange={(open) => !open && setDetailProduct(null)}>
        <DialogContent>
          {detailProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{detailProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[hsl(var(--muted))]">
                  <img
                    src={detailProduct.images[0]}
                    alt={detailProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{detailProduct.category}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-[hsl(var(--primary))]">
                    {formatPrice(detailProduct.price)}
                  </span>
                  {detailProduct.originalPrice && (
                    <span className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                      {formatPrice(detailProduct.originalPrice)}
                    </span>
                  )}
                </div>
                {detailProduct.shortDescription && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-4">
                    {detailProduct.shortDescription}
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" asChild>
                  <Link href={`/products/${detailProduct.slug}`}>View product</Link>
                </Button>
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    handleAddToCart(detailProduct);
                    setDetailProduct(null);
                  }}
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
