"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Heart, MapPin, ShoppingCart, Star, ArrowRight, Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { orderApi } from "@/services/api";
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
  const { user, logout } = useAuth();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [orders, setOrders] = useState<DisplayOrder[]>([]);

  useEffect(() => {
    orderApi
      .list({ limit: 10 })
      .then((res) => {
        const apiRows = (
          (res.data ?? []) as Parameters<typeof mapApiOrder>[0][]
        ).map((o) => mapApiOrder(o));
        setOrders(apiRows);
      })
      .catch(() => {
        setOrders([]);
      });
  }, []);

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package, href: "/dashboard/orders", color: "gradient-forest" },
    { label: "Wishlist Items", value: wishlistCount, icon: Heart, href: "/dashboard/wishlist", color: "gradient-saffron" },
    { label: "Cart Items", value: cartCount, icon: ShoppingCart, href: "/cart", color: "gradient-earth" },
    { label: "Saved Addresses", value: 0, icon: MapPin, href: "/dashboard/addresses", color: "gradient-forest" },
  ];

  return (
    <div className="space-y-6">
      <motion.div className="bg-[hsl(var(--card))] rounded-2xl border p-6 gradient-himalaya relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name ?? "Friend"} 👋</h1>
            <p className="text-white/60 text-sm mt-1">Here&apos;s a summary of your account activity.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="shrink-0 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
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
        {orders.length === 0 ? (
          <EmptyState
            compact
            title="No orders yet"
            description="Your order history will appear here after checkout."
            primaryAction={{ label: "Shop Now", href: "/products" }}
          />
        ) : (
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
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold">Loyalty Points</h3>
          </div>
          <EmptyState
            compact
            icon={Star}
            title="Loyalty coming soon"
            description="Points program is not available yet."
            className="mt-2"
          />
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-[hsl(var(--primary))]" />
            <h3 className="font-bold">Exclusive Offer</h3>
          </div>
          <EmptyState
            compact
            icon={Leaf}
            title="Offers coming soon"
            description="Promotions will appear here when they are available."
            primaryAction={{ label: "Browse Products", href: "/products" }}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}
