"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Heart, ShoppingCart, Truck, Shield, RotateCcw,
  ChevronRight, Plus, Minus, Check, MapPin, Share2, Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductCard } from "@/components/shared/product-card";
import { useCart } from "@/hooks/use-cart";
import { productApi, shippingApi } from "@/services/api";
import type { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const mockReviews = [
  { id: 1, name: "Priya S.", avatar: "https://i.pravatar.cc/60?img=1", rating: 5, date: "Dec 12, 2024", comment: "Absolutely love this product! The quality is exceptional and it tastes just like what I remember from my travels to Himachal.", verified: true },
  { id: 2, name: "Rahul V.", avatar: "https://i.pravatar.cc/60?img=7", rating: 5, date: "Dec 5, 2024", comment: "Superb quality, genuine product. Packaging was perfect. Will definitely order again!", verified: true },
  { id: 3, name: "Anita K.", avatar: "https://i.pravatar.cc/60?img=5", rating: 4, date: "Nov 28, 2024", comment: "Good product, delivered on time. The quantity was exactly as mentioned. Recommended!", verified: true },
];

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    productApi
      .getById(slug)
      .then((res) => {
        setProduct(res.data);
        setRelated(
          products
            .filter((p) => p.categorySlug === res.data.categorySlug && p.id !== res.data.id)
            .slice(0, 4)
        );
      })
      .catch(() => {
        const mock = products.find((p) => p.slug === slug);
        if (mock) {
          setProduct(mock);
          setRelated(
            products.filter((p) => p.categorySlug === mock.categorySlug && p.id !== mock.id).slice(0, 4)
          );
        }
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

  const wishlisted = isWishlisted(product.id);
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedToCart(true);
    toast({ title: "Added to cart!", description: `${quantity}x ${product.name}` });
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) return;
    try {
      const res = await shippingApi.estimate({
        deliveryPincode: pincode,
        weight: 0.5,
        cod: false,
      });
      const data = res.data as {
        serviceable: boolean;
        recommended?: { estimatedDays?: string | number };
      };
      if (data.serviceable) {
        setPincodeChecked(true);
        setDeliveryEstimate(
          data.recommended?.estimatedDays
            ? String(data.recommended.estimatedDays)
            : "5-7"
        );
      } else {
        toast({ title: "Delivery not available to this pincode", variant: "destructive" });
        setPincodeChecked(false);
      }
    } catch {
      setPincodeChecked(true);
      setDeliveryEstimate("5-7");
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
              className="relative  rounded-2xl overflow-hidden bg-[hsl(var(--muted))] border"
            >
              <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              {product.discount && (
                <div className="absolute top-4 left-4">
                  <Badge variant="saffron" className="text-sm font-bold">-{product.discount}%</Badge>
                </div>
              )}
              <button
                onClick={() => { toggleItem(product); toast({ title: wishlisted ? "Removed from wishlist" : "Added to wishlist!", description: product.name }); }}
                className={cn("absolute top-4 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors", wishlisted ? "bg-red-500 text-white" : "bg-white/90 text-gray-700 hover:bg-red-50")}
              >
                <Heart className={cn("w-5 h-5", wishlisted && "fill-current")} />
              </button>
            </motion.div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn("w-20 h-20 rounded-xl overflow-hidden border-2 transition-all", selectedImage === i ? "border-[hsl(var(--primary))] shadow-md" : "border-transparent opacity-60 hover:opacity-100")}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
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
                <span className="text-green-600 text-sm font-medium">✓ In Stock ({product.stock})</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-[hsl(var(--primary))]">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-[hsl(var(--muted-foreground))] line-through">{formatPrice(product.originalPrice)}</span>
                    <Badge variant="green" className="text-sm">Save {formatPrice(savings)}</Badge>
                  </>
                )}
              </div>

              <p className="text-[hsl(var(--foreground))]/80 leading-relaxed">{product.shortDescription}</p>
            </div>

            {/* Origin */}
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] p-3 bg-[hsl(var(--muted))]/50 rounded-xl">
              <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span>Origin: <strong className="text-[hsl(var(--foreground))]">{product.origin}</strong></span>
              {product.weight && <><span>•</span><span>Weight: <strong className="text-[hsl(var(--foreground))]">{product.weight}</strong></span></>}
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
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Total: <strong className="text-[hsl(var(--foreground))]">{formatPrice(product.price * quantity)}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 relative overflow-hidden"
                onClick={handleAddToCart}
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
              <Button size="lg" variant="saffron" className="flex-1 gap-2">
                Buy Now
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

            {/* Delivery checker */}
            <div className="p-4 border rounded-xl space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-[hsl(var(--primary))]" /> Check Delivery
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "")); setPincodeChecked(false); }}
                  placeholder="Enter 6-digit pincode"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-[hsl(var(--background))]"
                />
                <Button size="sm" onClick={handleCheckPincode} disabled={pincode.length !== 6}>Check</Button>
              </div>
              {pincodeChecked && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-green-600 text-sm">
                  <Check className="w-4 h-4" /> Delivery available! Estimated: {deliveryEstimate ?? "5–7"} business days
                </motion.div>
              )}
            </div>

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
              <TabsTrigger value="reviews">Reviews ({product.reviews})</TabsTrigger>
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
              <div className="space-y-4">
                <div className="flex items-center gap-6 p-5 bg-[hsl(var(--muted))]/30 rounded-2xl mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[hsl(var(--primary))]">{product.rating}</div>
                    <div className="flex items-center gap-0.5 justify-center my-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300")} />)}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{product.reviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((r) => (
                      <div key={r} className="flex items-center gap-2">
                        <span className="text-xs w-4">{r}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))]">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${r === 5 ? 70 : r === 4 ? 20 : r === 3 ? 8 : 2}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {mockReviews.map((review) => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-5 border rounded-2xl">
                    <div className="flex items-start gap-3">
                      <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{review.name}</span>
                          {review.verified && <Badge variant="green" className="text-[10px] py-0">Verified</Badge>}
                          <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />)}
                        </div>
                        <p className="text-sm text-[hsl(var(--foreground))]/80">{review.comment}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
