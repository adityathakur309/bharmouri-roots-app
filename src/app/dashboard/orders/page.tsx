"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Eye, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orderApi } from "@/services/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { orderStatusConfig } from "@/lib/order-status";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  trackingId?: string;
}

export default function OrdersPage() {
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .list({ limit: 50 })
      .then((res) => setOrders(res.data as ApiOrder[]))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">My Orders</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{orders.length} orders total</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "processing", "shipped", "delivered", "payment_pending"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
              filter === f
                ? "gradient-forest text-white shadow-sm"
                : "bg-[hsl(var(--card))] border hover:bg-[hsl(var(--muted))]"
            )}
          >
            {f === "all" ? "All Orders" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : filtered.length === 0 ? (
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/40" />
          <p className="font-semibold mb-1">No orders found</p>
          <Link href="/products">
            <Button className="mt-4">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => {
            const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b bg-[hsl(var(--muted))]/30">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="font-bold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Qty: {item.quantity} · {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.trackingId && (
                  <p className="px-4 pb-2 text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Tracking: {order.trackingId}
                  </p>
                )}

                <div className="flex gap-2 p-4 border-t">
                  <Button size="sm" variant="outline" className="gap-1.5" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
