"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CatalogImage } from "@/components/shared/catalog-image";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

const badgeConfig: Record<string, { label: string; variant: "default" | "saffron" | "green" | "gold" }> = {
  bestseller: { label: "Bestseller", variant: "saffron" },
  premium: { label: "Premium", variant: "gold" },
  handmade: { label: "Handmade", variant: "green" },
  seasonal: { label: "Seasonal", variant: "saffron" },
  heritage: { label: "Heritage", variant: "gold" },
  gift: { label: "Gift", variant: "default" },
  traditional: { label: "Traditional", variant: "green" },
};

function productThemeKey(product: Product): string {
  const slugPart = product.slug.split("-").slice(0, 2).join("-");
  return slugPart || product.categorySlug || "default";
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleItem } = useWishlist();
  const wishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const showShopActions = !isAdmin;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product);
    toast({ title: "Added to cart!", description: product.name });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
    toast({
      title: wishlisted ? "Removed from wishlist" : "Added to wishlist!",
      description: product.name,
    });
  };

  const badge = product.badge ? badgeConfig[product.badge] : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("group relative h-full max-sm:transform-none", className)}
    >
      <Link href={`/products/${product.slug}`} className="block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl bg-[hsl(var(--card))] border shadow-sm hover:shadow-xl transition-shadow duration-300">
          {/* Shorter image on mobile; square from sm+ */}
          <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-[hsl(var(--muted))] shrink-0">
            <CatalogImage
              src={product.images[0]}
              alt={product.name}
              themeKey={productThemeKey(product)}
              variant="product"
              className="group-hover:scale-105 transition-transform duration-500"
            />

            {showShopActions && (
              <button
                type="button"
                onClick={handleWishlist}
                className={cn(
                  "absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all z-10",
                  "sm:opacity-0 sm:scale-90 sm:group-hover:opacity-100 sm:group-hover:scale-100",
                  wishlisted
                    ? "bg-red-500 text-white"
                    : "bg-white/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300"
                )}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={cn("w-3.5 h-3.5", wishlisted && "fill-current")} />
              </button>
            )}

            {showShopActions && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWishlist}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors",
                    wishlisted ? "bg-red-500 text-white" : "bg-white text-gray-700 hover:bg-red-50"
                  )}
                >
                  <Heart className={cn("w-4 h-4", wishlisted && "fill-current")} />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCart}
                  className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center shadow-lg hover:bg-[hsl(var(--primary))]/90"
                >
                  <ShoppingCart className="w-4 h-4" />
                </motion.button>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-9 h-9 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                </motion.div>
              </div>
            )}

            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
              {product.isNew && (
                <Badge variant="green" className="text-[9px] sm:text-[10px] py-0 px-1.5 sm:py-0.5">New</Badge>
              )}
              {product.discount ? (
                <Badge variant="saffron" className="text-[9px] sm:text-[10px] py-0 px-1.5 sm:py-0.5">
                  -{product.discount}%
                </Badge>
              ) : null}
              {badge ? (
                <Badge variant={badge.variant} className="hidden sm:inline-flex text-[10px] py-0.5">
                  {badge.label}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 flex-col p-2.5 sm:p-4">
            <p className="hidden sm:block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1 uppercase tracking-wide">
              {product.category}
            </p>
            <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 mb-1 sm:mb-2 group-hover:text-[hsl(var(--primary))] transition-colors">
              {product.name}
            </h3>

            {/* Compact rating on mobile; full stars from sm+ */}
            <div className="flex items-center gap-1 mb-1.5 sm:mb-3">
              <div className="hidden sm:flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < Math.floor(product.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    )}
                  />
                ))}
              </div>
              <Star className="sm:hidden w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs text-[hsl(var(--muted-foreground))]">
                {product.rating}
                <span className="hidden sm:inline"> ({product.reviews})</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-1 mt-auto">
              <div className="flex items-baseline gap-1 sm:gap-2 min-w-0">
                <span className="text-sm sm:text-base font-bold text-[hsl(var(--primary))] truncate">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice ? (
                  <span className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] line-through shrink-0">
                    {formatPrice(product.originalPrice)}
                  </span>
                ) : null}
              </div>
              {product.weight ? (
                <span className="hidden sm:inline-flex text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full shrink-0">
                  {product.weight}
                </span>
              ) : null}
            </div>

            {/* Mobile: View product → full detail (reviews included). Desktop: Add to cart */}
            <span className="sm:hidden mt-2 inline-flex w-full items-center justify-center rounded-md bg-[hsl(var(--primary))] px-2 py-1.5 text-[11px] font-semibold text-white">
              View product
            </span>

            {showShopActions ? (
              <Button
                size="sm"
                className="w-full mt-3 hidden sm:inline-flex"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </Button>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
