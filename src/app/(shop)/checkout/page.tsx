"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  Lock,
  CreditCard,
  Smartphone,
  Banknote,
  MapPin,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { orderApi, addressApi, settingsApi } from "@/services/api";
import { MockPaymentDialog } from "@/components/checkout/mock-payment-dialog";
import { isBuyNowActive } from "@/lib/cart/buy-now";

const steps = ["Address", "Payment", "Review"];

const paymentMethods = [
  { id: "upi", icon: Smartphone, label: "UPI", desc: "Pay via any UPI app", api: "razorpay" as const },
  { id: "card", icon: CreditCard, label: "Credit / Debit Card", desc: "All major cards accepted", api: "razorpay" as const },
  { id: "netbanking", icon: Banknote, label: "Net Banking", desc: "All major banks", api: "razorpay" as const },
  { id: "cod", icon: Package, label: "Cash on Delivery", desc: "Pay when delivered", api: "cod" as const },
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const {
    items,
    getSubtotal,
    getTotal,
    couponDiscount,
    clearCart,
    prepareCheckoutCart,
    applyBuyNowIfPending,
    abandonBuyNow,
    completeBuyNow,
  } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [codAllowed, setCodAllowed] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [buyNowReady, setBuyNowReady] = useState(() => !isBuyNowActive());
  const orderPlacedRef = useRef(false);
  const [mockPaymentOpen, setMockPaymentOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amount: number;
    isMock: boolean;
  } | null>(null);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      setAddress((a) => ({
        ...a,
        fullName: a.fullName || user.name,
        email: a.email || user.email,
        phone: user.phone ?? a.phone,
      }));
    }
  }, [user]);

  // COD: global setting AND every cart product must explicitly allow COD
  useEffect(() => {
    let cancelled = false;
    settingsApi
      .getPublic()
      .then((res) => {
        if (cancelled) return;
        const globalOn = Boolean(res.data?.codEnabled);
        const allProductsCod =
          items.length > 0 &&
          items.every((item) => Boolean(item.product.codEnabled));
        const allowed = globalOn && allProductsCod;
        setCodAllowed(allowed);
        setPaymentMethod((prev) => (prev === "cod" && !allowed ? "upi" : prev));
      })
      .catch(() => {
        if (!cancelled) {
          setCodAllowed(false);
          setPaymentMethod((prev) => (prev === "cod" ? "upi" : prev));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [items]);

  // After login / cart sync, keep Buy Now as a single-product checkout cart.
  useEffect(() => {
    if (authLoading) return;
    if (!isBuyNowActive()) {
      setBuyNowReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      await applyBuyNowIfPending();
      if (!cancelled) setBuyNowReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, applyBuyNowIfPending]);

  // Leaving checkout without completing restores the previous cart for Buy Now sessions.
  // Deferred so React Strict Mode remount does not falsely treat the first unmount as abandon.
  useEffect(() => {
    let mounted = true;
    return () => {
      mounted = false;
      queueMicrotask(() => {
        if (!mounted && !orderPlacedRef.current && isBuyNowActive()) {
          void abandonBuyNow();
        }
      });
    };
  }, [abandonBuyNow]);

  useEffect(() => {
    addressApi
      .list()
      .then((res) => {
        const list = res.data as Array<{
          fullName: string;
          phone: string;
          email: string;
          addressLine: string;
          city: string;
          state: string;
          pincode: string;
          isDefault?: boolean;
        }>;
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) {
          setAddress({
            fullName: def.fullName,
            phone: def.phone,
            email: def.email,
            addressLine: def.addressLine,
            city: def.city,
            state: def.state,
            pincode: def.pincode,
          });
        }
      })
      .catch(() => {});
  }, []);

  const finishSuccessfulOrder = async () => {
    orderPlacedRef.current = true;
    await clearCart();
    completeBuyNow();
  };

  const subtotal = getSubtotal();
  const total = getTotal();
  const shipping = subtotal >= 999 ? 0 : 80;
  const finalTotal = total + shipping;

  const selectedPayment = paymentMethods.find((m) => m.id === paymentMethod);
  const apiPaymentMethod = selectedPayment?.api ?? "razorpay";
  const visiblePaymentMethods = paymentMethods.filter(
    (m) => m.id !== "cod" || codAllowed
  );

  const validateAddress = () => {
    if (
      !address.fullName ||
      !address.phone ||
      !address.email ||
      !address.addressLine ||
      !address.city ||
      !address.state ||
      !address.pincode.match(/^\d{6}$/)
    ) {
      toast({ title: "Please complete delivery address", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleMockPayment = async (outcome: "success" | "failed" | "pending") => {
    if (!pendingPayment) return;
    setIsPlacing(true);
    try {
      const paymentId = `pay_mock_${outcome}_${Date.now()}`;
      await orderApi.verifyPayment({
        orderId: pendingPayment.orderId,
        razorpayOrderId: pendingPayment.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: `mock_${outcome}`,
        mockOutcome: outcome,
      });

      if (outcome === "failed") {
        toast({ title: "Payment failed", variant: "destructive" });
        setMockPaymentOpen(false);
        return;
      }

      if (outcome === "pending") {
        toast({ title: "Payment pending", description: "Complete payment from your dashboard." });
        setMockPaymentOpen(false);
        router.push("/dashboard/orders");
        return;
      }

      setPlacedOrderId(pendingPayment.orderId);
      setPlacedOrderNumber(pendingPayment.orderNumber);
      setOrderPlaced(true);
      setMockPaymentOpen(false);
      await finishSuccessfulOrder();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Payment failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  const openRazorpayCheckout = async (
    paymentData: {
      razorpayOrderId: string;
      amount: number;
      keyId: string;
      orderId: string;
      orderNumber: string;
    }
  ) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      toast({ title: "Could not load payment gateway", variant: "destructive" });
      return;
    }

    const rzp = new window.Razorpay({
      key: paymentData.keyId,
      amount: paymentData.amount,
      currency: "INR",
      name: "BharmouriRoots",
      description: `Order ${paymentData.orderNumber}`,
      order_id: paymentData.razorpayOrderId,
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await orderApi.verifyPayment({
            orderId: paymentData.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setPlacedOrderId(paymentData.orderId);
          setPlacedOrderNumber(paymentData.orderNumber);
          setOrderPlaced(true);
          await finishSuccessfulOrder();
        } catch {
          toast({ title: "Payment verification failed", variant: "destructive" });
        }
      },
      prefill: {
        name: address.fullName,
        email: address.email,
        contact: address.phone,
      },
      theme: { color: "#2d6a4f" },
    });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;
    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }

    setIsPlacing(true);
    try {
      const cartReady = await prepareCheckoutCart();
      if (!cartReady.ok) {
        if (cartReady.reason === "login") {
          toast({ title: "Please sign in to checkout", variant: "destructive" });
          router.push("/login?callbackUrl=/checkout");
          return;
        }
        if (cartReady.reason === "invalid-products") {
          toast({
            title: "Cart not synced",
            description:
              "Remove demo items and add products from the shop (run npm run seed if the catalog is empty).",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Your cart is empty on the server", variant: "destructive" });
        return;
      }

      const createRes = await orderApi.create({
        paymentMethod: apiPaymentMethod,
        shippingAddress: address,
      });

      const order = createRes.data as {
        id: string;
        orderNumber: string;
      };

      if (apiPaymentMethod === "cod") {
        setPlacedOrderId(order.id);
        setPlacedOrderNumber(order.orderNumber);
        setOrderPlaced(true);
        await finishSuccessfulOrder();
        return;
      }

      const payRes = await orderApi.createRazorpayOrder(order.id);
      const payment = payRes.data;

      if (payment.isMock) {
        setPendingPayment({
          orderId: order.id,
          orderNumber: order.orderNumber,
          razorpayOrderId: payment.razorpayOrderId,
          amount: payment.amount,
          isMock: true,
        });
        setMockPaymentOpen(true);
        return;
      }

      await openRazorpayCheckout({
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount,
        keyId: payment.keyId,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Could not place order";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <motion.div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 rounded-full gradient-forest flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Order Placed! 🎉</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-2">
            Thank you for your order! Your authentic Himachali products are being prepared with love.
          </p>
          <p className="font-semibold text-[hsl(var(--primary))] mb-6">
            Order ID: #{placedOrderNumber || placedOrderId}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8">
            Expected delivery: 5–7 business days. You&apos;ll receive an email confirmation shortly.
          </p>
          <motion.div className="flex gap-3 justify-center">
            <Link href="/dashboard/orders">
              <Button size="lg" className="gap-2">View My Orders</Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">Continue Shopping</Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (!buyNowReady) {
    return (
      <motion.div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[hsl(var(--muted-foreground))]">Preparing checkout…</p>
      </motion.div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[hsl(var(--muted-foreground))]">Your cart is empty.</p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen py-8">
      <MockPaymentDialog
        open={mockPaymentOpen}
        amount={pendingPayment?.amount ?? 0}
        orderNumber={pendingPayment?.orderNumber ?? ""}
        onClose={() => setMockPaymentOpen(false)}
        onOutcome={handleMockPayment}
        isProcessing={isPlacing}
      />

      <motion.div className="container mx-auto px-4 max-w-6xl">
        <motion.div className="flex items-center gap-3 mb-8">
          <Lock className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h1 className="text-2xl font-bold">Secure Checkout</h1>
        </motion.div>

        <motion.div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <motion.div key={s} className="flex items-center gap-2">
              <motion.div
                className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  i === step ? "text-[hsl(var(--primary))]" : i < step ? "text-green-600" : "text-[hsl(var(--muted-foreground))]"
                )}
              >
                <motion.div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2",
                    i === step
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white"
                      : i < step
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-[hsl(var(--border))]"
                  )}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </motion.div>
                <span className="hidden sm:block">{s}</span>
              </motion.div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <motion.div className="bg-[hsl(var(--card))] rounded-2xl border p-6">
                    <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" /> Delivery Address
                    </h2>
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.div className="sm:col-span-2">
                        <Label className="mb-1.5 block">Full Name *</Label>
                        <Input
                          value={address.fullName}
                          onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </motion.div>
                      <motion.div>
                        <Label className="mb-1.5 block">Phone Number *</Label>
                        <Input
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          placeholder="+91 00000 00000"
                        />
                      </motion.div>
                      <motion.div>
                        <Label className="mb-1.5 block">Email Address *</Label>
                        <Input
                          type="email"
                          value={address.email}
                          onChange={(e) => setAddress({ ...address, email: e.target.value })}
                          placeholder="you@example.com"
                        />
                      </motion.div>
                      <motion.div className="sm:col-span-2">
                        <Label className="mb-1.5 block">Address *</Label>
                        <Input
                          value={address.addressLine}
                          onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                          placeholder="House no., Street, Area"
                        />
                      </motion.div>
                      <motion.div>
                        <Label className="mb-1.5 block">City *</Label>
                        <Input
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="City"
                        />
                      </motion.div>
                      <motion.div>
                        <Label className="mb-1.5 block">State *</Label>
                        <Input
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          placeholder="State"
                        />
                      </motion.div>
                      <motion.div>
                        <Label className="mb-1.5 block">Pincode *</Label>
                        <Input
                          value={address.pincode}
                          onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                          placeholder="000000"
                          maxLength={6}
                        />
                      </motion.div>
                    </motion.div>
                    <Button
                      size="lg"
                      className="w-full mt-6 gap-2"
                      onClick={() => validateAddress() && setStep(1)}
                    >
                      Continue to Payment <ChevronRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <motion.div className="bg-[hsl(var(--card))] rounded-2xl border p-6">
                    <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[hsl(var(--primary))]" /> Payment Method
                    </h2>
                    <motion.div className="space-y-3">
                      {visiblePaymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            paymentMethod === method.id
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={paymentMethod === method.id}
                            onChange={() => setPaymentMethod(method.id)}
                            className="sr-only"
                          />
                          <motion.div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              paymentMethod === method.id
                                ? "gradient-forest text-white"
                                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                            )}
                          >
                            <method.icon className="w-5 h-5" />
                          </motion.div>
                          <motion.div className="flex-1">
                            <p className="font-semibold text-sm">{method.label}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{method.desc}</p>
                          </motion.div>
                          {paymentMethod === method.id && (
                            <Check className="w-5 h-5 text-[hsl(var(--primary))]" />
                          )}
                        </label>
                      ))}
                    </motion.div>
                    <motion.div className="flex gap-3 mt-6">
                      <Button variant="outline" onClick={() => setStep(0)}>
                        Back
                      </Button>
                      <Button size="lg" className="flex-1 gap-2" onClick={() => setStep(2)}>
                        Review Order <ChevronRight className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <motion.div className="bg-[hsl(var(--card))] rounded-2xl border p-6">
                    <h2 className="font-bold text-lg mb-5">Review Your Order</h2>
                    <motion.div className="space-y-3 mb-6">
                      {items.map((item) => (
                        <motion.div key={item.product.id} className="flex gap-3">
                          <motion.div className="w-14 h-14 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                          <motion.div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Qty: {item.quantity}</p>
                          </motion.div>
                          <span className="font-semibold text-sm shrink-0">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.div className="p-3 bg-[hsl(var(--muted))]/30 rounded-xl text-sm space-y-1 mb-6">
                      <p className="font-semibold">Delivery to:</p>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        {address.fullName}, {address.phone}
                      </p>
                      <p className="text-[hsl(var(--muted-foreground))]">
                        {address.addressLine}, {address.city}, {address.state} - {address.pincode}
                      </p>
                    </motion.div>
                    <motion.div className="p-3 bg-[hsl(var(--muted))]/30 rounded-xl text-sm mb-6">
                      <p className="font-semibold">
                        Payment:{" "}
                        <span className="font-normal">
                          {selectedPayment?.label}
                          {apiPaymentMethod === "razorpay" ? " (Razorpay)" : ""}
                        </span>
                      </p>
                    </motion.div>
                    <motion.div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 gap-2"
                        onClick={handlePlaceOrder}
                        disabled={isPlacing}
                      >
                        {isPlacing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" /> Place Order • {formatPrice(finalTotal)}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div>
            <motion.div className="bg-[hsl(var(--card))] rounded-2xl border p-5 sticky top-24">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <motion.div className="space-y-2 text-sm mb-4">
                <motion.div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </motion.div>
                {couponDiscount > 0 && (
                  <motion.div className="flex justify-between text-green-600">
                    <span>Discount ({couponDiscount}%)</span>
                    <span>- {formatPrice(subtotal - total)}</span>
                  </motion.div>
                )}
                <motion.div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </motion.div>
                <motion.div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-[hsl(var(--primary))]">{formatPrice(finalTotal)}</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
