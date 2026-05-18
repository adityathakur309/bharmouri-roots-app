"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 80;

export default function CartPage() {
  const { items, removeItem, updateQuantity, applyCoupon, removeCoupon, couponCode, couponDiscount, getSubtotal, getTotal, clearCart } = useCart();
  const { toast } = useToast();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const subtotal = getSubtotal();
  const total = getTotal();
  const discountAmount = subtotal - total;
  const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
  const shippingFee = isFreeShipping ? 0 : SHIPPING_FEE;
  const finalTotal = total + shippingFee;
  const progressToFreeShipping = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);

  const handleApplyCoupon = async () => {
    const success = await applyCoupon(couponInput);
    if (success) {
      setCouponError("");
      toast({ title: "Coupon applied!", description: `${couponInput.toUpperCase()} — ${couponDiscount || ""}% off` });
    } else {
      setCouponError("Invalid coupon code. Try HIMALAYA10 or ORGANIC20");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center px-4">
          <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-[hsl(var(--muted-foreground))]/40" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link href="/products">
            <Button size="lg" className="gap-2">
              <ShoppingCart className="w-5 h-5" /> Start Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-6 h-6 text-[hsl(var(--primary))]" />
          <h1 className="text-2xl font-bold">My Cart</h1>
          <Badge variant="secondary">{items.length} item{items.length !== 1 ? "s" : ""}</Badge>
        </div>

        {/* Free shipping progress */}
        {!isFreeShipping && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-[hsl(var(--primary))]/10 rounded-2xl border border-[hsl(var(--primary))]/20">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-[hsl(var(--primary))]">
                <Leaf className="w-4 h-4 inline mr-1" />
                Add {formatPrice(SHIPPING_THRESHOLD - subtotal)} more for free shipping!
              </span>
              <span className="text-[hsl(var(--muted-foreground))]">{Math.round(progressToFreeShipping)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToFreeShipping}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full gradient-forest"
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="bg-[hsl(var(--card))] rounded-2xl border p-4 flex gap-4"
                >
                  <Link href={`/products/${item.product.slug}`}>
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{item.product.category}</p>
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="font-semibold text-sm leading-snug hover:text-[hsl(var(--primary))] transition-colors line-clamp-2">{item.product.name}</h3>
                        </Link>
                        {item.product.origin && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">📍 {item.product.origin}</p>
                        )}
                      </div>
                      <button
                        onClick={() => { removeItem(item.product.id); toast({ title: "Removed from cart", description: item.product.name }); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-[hsl(var(--primary))]">{formatPrice(item.product.price * item.quantity)}</div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">{formatPrice(item.product.price)} each</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between items-center pt-2">
              <Link href="/products">
                <Button variant="outline" size="sm" className="gap-2">
                  <ShoppingBag className="w-4 h-4" /> Continue Shopping
                </Button>
              </Link>
              <button
                onClick={() => { clearCart(); toast({ title: "Cart cleared" }); }}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[hsl(var(--accent))]" /> Coupon Code
              </h3>
              {couponCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">{couponCode}</p>
                    <p className="text-xs text-green-600">{couponDiscount}% discount applied</p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-[hsl(var(--background))]"
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <Button size="sm" onClick={handleApplyCoupon}>Apply</Button>
                  </div>
                  {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Try: HIMALAYA10, ORGANIC20, BHARMOUR15</p>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-3">
              <h3 className="font-bold mb-4">Order Summary</h3>

              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between text-sm text-green-600">
                  <span>Coupon discount ({couponDiscount}%)</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </motion.div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Shipping</span>
                <span className={isFreeShipping ? "text-green-600 font-medium" : "font-medium"}>
                  {isFreeShipping ? "FREE" : formatPrice(shippingFee)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Taxes</span>
                <span className="text-[hsl(var(--muted-foreground))]">Included</span>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[hsl(var(--primary))]">{formatPrice(finalTotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="text-center text-xs text-green-600 font-medium">
                  🎉 You save {formatPrice(discountAmount)} on this order!
                </div>
              )}

              <Link href="/checkout" className="block">
                <Button size="lg" className="w-full gap-2 mt-2">
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <div className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                🔒 Secure checkout • 100% encrypted
              </div>
            </div>

            {/* Payment icons */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border p-4">
              <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mb-3">We accept</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["UPI", "Visa", "Mastercard", "PayTM", "COD"].map((p) => (
                  <span key={p} className="px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-xs font-semibold">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
