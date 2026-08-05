"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Eye, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { orderApi } from "@/services/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { orderStatusConfig } from "@/lib/order-status";
import { Skeleton } from "@/components/ui/skeleton";
import { useListViewMode } from "@/hooks/use-list-view-mode";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";

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
  const [detailOrder, setDetailOrder] = useState<ApiOrder | null>(null);
  const { viewMode, setViewMode } = useListViewMode();

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">My Orders</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{orders.length} orders total</p>
        </div>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
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
      ) : viewMode === "card" ? (
        <div className="space-y-4">
          {filtered.map((order, i) => {
            const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
            const StatusIcon = status.icon;
            const previewItems = order.items.slice(0, 2);
            const extraCount = order.items.length - previewItems.length;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-[hsl(var(--muted))]/30 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Package className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{order.orderNumber}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="font-bold text-sm hidden sm:inline">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 space-y-2">
                  {previewItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
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
                  {extraCount > 0 && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] pl-1">
                      +{extraCount} more item{extraCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {order.trackingId && (
                  <p className="px-3 sm:px-4 pb-2 text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Tracking: {order.trackingId}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-t">
                  <span className="font-bold text-sm sm:hidden">{formatPrice(order.total)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 ml-auto"
                    onClick={() => setDetailOrder(order)}
                  >
                    <Eye className="w-3.5 h-3.5" /> Full details
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden divide-y">
          {filtered.map((order) => {
            const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
            const StatusIcon = status.icon;
            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-[hsl(var(--muted))]/20 transition-colors"
              >
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <Package className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{order.orderNumber}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
                <span className="font-bold text-sm sm:w-24 sm:text-right">{formatPrice(order.total)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0 w-full sm:w-auto"
                  onClick={() => setDetailOrder(order)}
                >
                  <Eye className="w-3.5 h-3.5" /> Full details
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {detailOrder && (() => {
            const status = orderStatusConfig[detailOrder.status] ?? orderStatusConfig.processing;
            const StatusIcon = status.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{detailOrder.orderNumber}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {formatDate(detailOrder.createdAt)}
                    </span>
                    <span className="font-bold ml-auto">{formatPrice(detailOrder.total)}</span>
                  </div>

                  {detailOrder.trackingId && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                      <Truck className="w-4 h-4" /> Tracking: {detailOrder.trackingId}
                    </p>
                  )}

                  <div className="space-y-3 border-t pt-3">
                    <p className="text-sm font-semibold">Items ({detailOrder.items.length})</p>
                    {detailOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Qty: {item.quantity} · {formatPrice(item.price)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button asChild>
                    <Link href={`/dashboard/orders/${detailOrder.id}`}>
                      View full order
                    </Link>
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
