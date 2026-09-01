"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Heart, ShoppingCart, Truck, Shield, RotateCcw,
  ChevronRight, Plus, Minus, Check, MapPin, Leaf, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductCard } from "@/components/shared/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { useCart } from "@/hooks/use-cart";
import { productApi } from "@/services/api";
import type { Product } from "@/types/product";
import type { ReviewSummary } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/hooks/use-wishlist";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { normalizeProductImageUrl } from "@/lib/utils/image-url";
import { ShippingAvailabilityChecker } from "@/components/shipping/shipping-availability-checker";

export function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [lensActive, setLensActive] = useState(false);

  const router = useRouter();
  const { addItem, beginBuyNow } = useCart();
  const { toggleItem } = useWishlist();
  const wishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product?.id));
  const { isAdmin, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const showShopActions = !isAdmin;
  const [buyingNow, setBuyingNow] = useState(false);

  const handleReviewSummaryChange = useCallback((summary: ReviewSummary) => {
    setReviewCount(summary.total);
    setProduct((prev) =>
      prev
        ? { ...prev, rating: summary.average, reviews: summary.total }
        : prev
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi
      .getById(slug)
      .then(async (res) => {
        setProduct(res.data);
        setReviewCount(res.data.reviews ?? 0);
        const activeVariants = (res.data.variants ?? []).filter((v) => v.isActive !== false);
        setSelectedVariantId(activeVariants[0]?.id ?? null);
        try {
          const relatedRes = await productApi.list({ category: res.data.categorySlug, limit: 8 });
          setRelated(
            (relatedRes.data ?? [])
              .filter((item) => item.id !== res.data.id)
              .slice(0, 4)
          );
        } catch {
          setRelated([]);
        }
      })
      .catch(() => {
        setProduct(null);
        setRelated([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!product) return notFound();

  const activeVariants = (product.variants ?? []).filter((v) => v.isActive !== false);
  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0] ?? null;
  const unitPrice = selectedVariant
    ? selectedVariant.salePrice && selectedVariant.salePrice > 0
      ? selectedVariant.salePrice
      : selectedVariant.price
    : product.price;
  const compareAt = selectedVariant
    ? selectedVariant.salePrice && selectedVariant.salePrice > 0
      ? selectedVariant.price
      : product.originalPrice
    : product.originalPrice;
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const displayWeight = selectedVariant?.weight || product.weight;
  const cartProduct = {
    ...product,
    price: unitPrice,
    originalPrice: compareAt,
    stock: availableStock,
    weight: displayWeight,
  };
  const savings = compareAt ? compareAt - unitPrice : 0;

  const handleAddToCart = () => {
    addItem(cartProduct, quantity, selectedVariant?.id);
    setAddedToCart(true);
    toast({
      title: "Added to cart!",
      description: `${quantity}x ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ""}`,
    });
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = async () => {
    if (buyingNow) return;
    setBuyingNow(true);
    try {
      await beginBuyNow(cartProduct, quantity, selectedVariant?.id);
      if (!isAuthenticated) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
        return;
      }
      router.push("/checkout");
    } catch {
      toast({ title: "Could not start checkout", variant: "destructive" });
      setBuyingNow(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b bg-[hsl(var(--muted))]/30">
        <div className="container mx-auto px-4 max-w-7xl py-3">
          <nav className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
            <Link href="/" className="hover:text-[hsl(var(--primary))]">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/products" className="hover:text-[hsl(var(--primary))]">Products</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-[hsl(var(--primary))]">{product.category}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[hsl(var(--foreground))] font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[hsl(var(--muted))] border group cursor-zoom-in"
              onMouseEnter={() => setLensActive(true)}
              onMouseLeave={() => setLensActive(false)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setLensPos({
                  x: Math.min(100, Math.max(0, x)),
                  y: Math.min(100, Math.max(0, y)),
                });
              }}
              onClick={() => setZoomOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setZoomOpen(true);
                }
              }}
              aria-label="Zoom product image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeProductImageUrl(product.images[selectedImage] ?? "")}
                alt={product.name}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out",
                  lensActive && "scale-150"
                )}
                style={
                  lensActive
                    ? { transformOrigin: `${lensPos.x}% ${lensPos.y}%` }
                    : undefined
                }
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 text-white text-[11px] px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5" /> Click to enlarge
              </div>
              {product.discount && (
                <div className="absolute top-4 left-4">
                  <Badge variant="saffron" className="text-sm font-bold">-{product.discount}%</Badge>
                </div>
              )}
              {showShopActions && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(product);
                    toast({
                      title: wishlisted ? "Removed from wishlist" : "Added to wishlist!",
                      description: product.name,
                    });
                  }}
                  className={cn("absolute top-4 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors", wishlisted ? "bg-red-500 text-white" : "bg-white/90 text-gray-700 hover:bg-red-50")}
                >
                  <Heart className={cn("w-5 h-5", wishlisted && "fill-current")} />
                </button>
              )}
            </motion.div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={cn("w-20 h-20 rounded-xl overflow-hidden border-2 transition-all", selectedImage === i ? "border-[hsl(var(--primary))] shadow-md" : "border-transparent opacity-60 hover:opacity-100")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={normalizeProductImageUrl(img)} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {product.isNew && <Badge variant="green">New Arrival</Badge>}
                {product.isBestseller && <Badge variant="saffron">Bestseller</Badge>}
                {product.badge && <Badge variant="gold" className="capitalize">{product.badge}</Badge>}
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide mb-1">{product.category}</p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
                  ))}
                </div>
                <span className="font-semibold text-sm">{product.rating}</span>
                <span className="text-[hsl(var(--muted-foreground))] text-sm">({product.reviews} reviews)</span>
                <span className="text-green-600 text-sm font-medium">✓ In Stock ({availableStock})</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-[hsl(var(--primary))]">{formatPrice(unitPrice)}</span>
                {compareAt && compareAt > unitPrice && (
                  <>
                    <span className="text-lg text-[hsl(var(--muted-foreground))] line-through">{formatPrice(compareAt)}</span>
                    <Badge variant="green" className="text-sm">Save {formatPrice(savings)}</Badge>
                  </>
                )}
              </div>

              <p className="text-[hsl(var(--foreground))]/80 leading-relaxed">{product.shortDescription}</p>
            </div>

            {activeVariants.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Select size / pack</label>
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => {
                    const price =
                      v.salePrice && v.salePrice > 0 ? v.salePrice : v.price;
                    const selected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={v.stock < 1}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setQuantity(1);
                        }}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                          selected
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            : "hover:bg-[hsl(var(--muted))]",
                          v.stock < 1 && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {v.name}
                        <span className="block text-[10px] font-normal opacity-80">
                          {formatPrice(price)}
                          {v.stock < 1 ? " · Out of stock" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Origin */}
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] p-3 bg-[hsl(var(--muted))]/50 rounded-xl">
              <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span>Origin: <strong className="text-[hsl(var(--foreground))]">{product.origin}</strong></span>
              {displayWeight && <><span>•</span><span>Weight: <strong className="text-[hsl(var(--foreground))]">{displayWeight}</strong></span></>}
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {product.features.map((f) => (
                <span key={f} className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-3 py-1">
                  <Leaf className="w-3 h-3" />{f}
                </span>
              ))}
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Total: <strong className="text-[hsl(var(--foreground))]">{formatPrice(unitPrice * quantity)}</strong></span>
              </div>
            </div>

            {showShopActions && (
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2 relative overflow-hidden"
                  onClick={handleAddToCart}
                  disabled={availableStock < 1}
                >
                  <AnimatePresence mode="wait">
                    {addedToCart ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                        <Check className="w-5 h-5" /> Added!
                      </motion.span>
                    ) : (
                      <motion.span key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                <Button
                  size="lg"
                  variant="saffron"
                  className="flex-1 gap-2"
                  onClick={handleBuyNow}
                  disabled={buyingNow || availableStock < 1}
                >
                  {buyingNow ? "Please wait…" : "Buy Now"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => { toggleItem(product); toast({ title: wishlisted ? "Removed from wishlist" : "Added to wishlist!" }); }}
                  className={cn("w-12 px-0", wishlisted && "text-red-500 border-red-200")}
                >
                  <Heart className={cn("w-5 h-5", wishlisted && "fill-current")} />
                </Button>
              </div>
            )}

            <ShippingAvailabilityChecker weight={0.5} cod={false} />

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              {[
                { icon: Shield, label: "Secure Payment", desc: "100% secure" },
                { icon: RotateCcw, label: "Easy Returns", desc: "7-day policy" },
                { icon: Leaf, label: "Organic Certified", desc: "No pesticides" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon className="w-5 h-5 mx-auto mb-1 text-[hsl(var(--primary))]" />
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Reviews */}
        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList className="mb-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviewCount})</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <div className="prose max-w-none">
                <p className="text-[hsl(var(--foreground))]/80 leading-relaxed mb-4">{product.description}</p>
                <h3 className="font-bold mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <ProductReviews
                productIdOrSlug={product.id}
                initialAverage={product.rating}
                initialTotal={product.reviews}
                onSummaryChange={handleReviewSummaryChange}
              />
            </TabsContent>

            <TabsContent value="shipping">
              <div className="space-y-4 max-w-2xl">
                {[
                  { icon: Truck, title: "Shipping", desc: "Free shipping on orders above ₹999. Standard delivery: 5–7 business days. Express delivery available at checkout." },
                  { icon: RotateCcw, title: "Returns", desc: "7-day return policy for all non-perishable items. Full refund or replacement for quality issues, no questions asked." },
                  { icon: Shield, title: "Quality Guarantee", desc: "Every product is quality-checked before dispatch. If you receive a damaged or incorrect item, we'll make it right immediately." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-4 border rounded-xl">
                    <div className="w-10 h-10 rounded-xl gradient-forest flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-[min(96vw,920px)] w-full border-0 bg-black/95 p-2 sm:p-3 text-white [&>button]:text-white">
          <DialogTitle className="sr-only">{product.name} — zoomed image</DialogTitle>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeProductImageUrl(product.images[selectedImage] ?? "")}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex justify-center gap-2 pt-1 pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "h-14 w-14 rounded-lg overflow-hidden border-2 transition-all",
                    selectedImage === i
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeProductImageUrl(img)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
