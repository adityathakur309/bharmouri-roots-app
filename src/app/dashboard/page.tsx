"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Heart, MapPin, ShoppingCart, Star, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { mockOrders } from "@/lib/mock-data";
import { orderApi } from "@/services/api";
import { withFallbackArray } from "@/lib/api-fallback";
import { formatPrice, formatDate } from "@/lib/utils";

type DisplayOrder = {
  id: string;
  date: string;
  status: string;
  total: number;
  items: Array<{ product: { images: string[] }; quantity: number }>;
};

function mapApiOrder(o: {
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  items: Array<{ image: string; quantity: number }>;
}): DisplayOrder {
  return {
    id: o.orderNumber,
    date: o.createdAt,
    status: o.status,
    total: o.total,
    items: o.items.map((i) => ({
      product: { images: [i.image] },
      quantity: i.quantity,
    })),
  };
}

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  shipped: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  payment_pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [orders, setOrders] = useState<DisplayOrder[]>(mockOrders);
  const [usingDemoOrders, setUsingDemoOrders] = useState(false);

  useEffect(() => {
    orderApi
      .list({ limit: 10 })
      .then((res) => {
        const apiRows = (
          (res.data ?? []) as Parameters<typeof mapApiOrder>[0][]
        ).map((o) => mapApiOrder(o));
        const list = withFallbackArray(apiRows.length ? apiRows : null, mockOrders);
        setOrders(list);
        setUsingDemoOrders(!apiRows.length);
      })
      .catch(() => {
        setOrders(mockOrders);
        setUsingDemoOrders(true);
      });
  }, []);

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package, href: "/dashboard/orders", color: "gradient-forest" },
    { label: "Wishlist Items", value: wishlistCount, icon: Heart, href: "/dashboard/wishlist", color: "gradient-saffron" },
    { label: "Cart Items", value: cartCount, icon: ShoppingCart, href: "/cart", color: "gradient-earth" },
    { label: "Saved Addresses", value: 2, icon: MapPin, href: "/dashboard/addresses", color: "gradient-forest" },
  ];

  return (
    <div className="space-y-6">
      <motion.div className="bg-[hsl(var(--card))] rounded-2xl border p-6 gradient-himalaya relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold text-white">{user?.name ?? "Friend"} 👋</h1>
          <p className="text-white/60 text-sm mt-1">Here&apos;s a summary of your account activity.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={stat.href}>
              <div className="bg-[hsl(var(--card))] rounded-2xl border p-4 hover:shadow-md transition-shadow group">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-between">
                  {stat.label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Recent Orders</h2>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm" className="gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        {usingDemoOrders && (
          <p className="text-xs text-amber-600 mb-3">Showing sample orders until you place your first order.</p>
        )}
        <div className="space-y-3">
          {orders.slice(0, 3).map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--muted))]/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                <img
                  src={order.items[0]?.product.images[0] ?? "/placeholder.png"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{order.id}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {formatDate(order.date)} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{formatPrice(order.total)}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                    statusColors[order.status] ?? statusColors.processing
                  }`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold">Loyalty Points</h3>
          </div>
          <div className="text-3xl font-bold text-gradient mb-1">240 pts</div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
            You need 60 more points to unlock Silver membership!
          </p>
          <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "80%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full gradient-saffron"
            />
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h3 className="font-bold">Exclusive Offer</h3>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Get 15% off on your next order with code</p>
          <div className="flex items-center gap-2 p-3 bg-[hsl(var(--primary))]/10 rounded-xl border border-[hsl(var(--primary))]/20 mb-3">
            <span className="font-bold text-[hsl(var(--primary))] tracking-wider">BHARMOUR15</span>
          </div>
          <Link href="/products">
            <Button size="sm" className="w-full gap-2">
              Shop Now <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
