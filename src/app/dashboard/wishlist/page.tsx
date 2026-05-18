"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: typeof items[0]) => {
    addItem(product);
    toast({ title: "Added to cart!", description: product.name });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" /> My Wishlist
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
        </div>
        {items.length > 0 && (
          <Button size="sm" onClick={() => { items.forEach((p) => addItem(p)); toast({ title: "All items added to cart!" }); }} className="gap-2">
            <ShoppingCart className="w-4 h-4" /> Add All to Cart
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-16 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted-foreground))]/30" />
          <h3 className="font-bold mb-2">Your wishlist is empty</h3>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">Save products you love to your wishlist and find them here.</p>
          <Link href="/products">
            <Button className="gap-2"><ShoppingBag className="w-4 h-4" /> Explore Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  <div className=" overflow-hidden bg-[hsl(var(--muted))]">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{product.category}</p>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[hsl(var(--primary))]">{formatPrice(product.price)}</span>
                    {product.originalPrice && <span className="text-xs text-[hsl(var(--muted-foreground))] line-through">{formatPrice(product.originalPrice)}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleAddToCart(product)}>
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { removeItem(product.id); toast({ title: "Removed from wishlist" }); }} className="w-9 px-0 text-red-500 hover:bg-red-50 hover:border-red-200">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
