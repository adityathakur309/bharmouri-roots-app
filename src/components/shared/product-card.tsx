"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
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

export function ProductCard({ product, className }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const { addItem } = useCart();
  const { toggleItem } = useWishlist();
  const wishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const showShopActions = !isAdmin;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addItem(product);
    toast({ title: "Added to cart!", description: product.name });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
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
      className={cn("group relative h-full", className)}
    >
      <Link href={`/products/${product.slug}`} className="block h-full">
        <div className="flex h-full flex-col rounded-2xl overflow-hidden bg-[hsl(var(--card))] border shadow-sm hover:shadow-xl transition-shadow duration-300">
          {/* Fixed aspect image — consistent card height on all breakpoints */}
          <div className="relative aspect-square w-full overflow-hidden bg-[hsl(var(--muted))] shrink-0">
            {!imgError ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl">
                {product.categorySlug === "organic-dals" ? "🌾" :
                 product.categorySlug === "dry-fruits" ? "🥜" :
                 product.categorySlug === "honey" ? "🍯" :
                 product.categorySlug === "apples" ? "🍎" :
                 product.categorySlug === "shawls" ? "🧣" :
                 product.categorySlug === "topi" ? "🧢" :
                 product.categorySlug === "pattu" ? "🧵" : "🌿"}
              </div>
            )}

            {showShopActions && (
              <button
                onClick={handleWishlist}
                className={cn(
                  "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all z-10",
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

            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.isNew && (
                <Badge variant="green" className="text-[10px] py-0.5">New</Badge>
              )}
              {product.discount && (
                <Badge variant="saffron" className="text-[10px] py-0.5">-{product.discount}%</Badge>
              )}
              {badge && (
                <Badge variant={badge.variant} className="text-[10px] py-0.5">{badge.label}</Badge>
              )}
            </div>

            {product.stock <= 10 && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] rounded-lg px-2 py-1 text-center font-medium">
                  Only {product.stock} left!
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1 uppercase tracking-wide">
              {product.category}
            </p>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-[hsl(var(--primary))] transition-colors">
              {product.name}
            </h3>

            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center">
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
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {product.rating} ({product.reviews})
              </span>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-[hsl(var(--primary))]">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-[hsl(var(--muted-foreground))] line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.weight && (
                <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full shrink-0">
                  {product.weight}
                </span>
              )}
            </div>

            {showShopActions && (
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
