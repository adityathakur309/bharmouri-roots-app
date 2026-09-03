"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogImage } from "@/components/shared/catalog-image";
import { refundApi, type RefundRequestItem } from "@/services/api/refund.service";
import { formatDate, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-indigo-100 text-indigo-800",
  quality_check: "bg-purple-100 text-purple-800",
  pickup_scheduled: "bg-cyan-100 text-cyan-800",
  pickup_completed: "bg-teal-100 text-teal-800",
  refund_processing: "bg-orange-100 text-orange-800",
  refunded: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

export default function ReturnsPage() {
  const [items, setItems] = useState<RefundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await refundApi.listMine();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-[hsl(var(--primary))]" />
          My Returns
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Track return requests, pickup, and refunds — like Amazon / Flipkart order returns.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-[hsl(var(--card))] border rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold mb-1">No return requests yet</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Open a return from an eligible order after delivery.
          </p>
          <Button asChild>
            <Link href="/dashboard/orders">View my orders</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[hsl(var(--card))] border rounded-2xl p-4 sm:p-5"
            >
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border">
                  <CatalogImage
                    src={item.productImage}
                    alt={item.productName}
                    themeKey={item.productName.toLowerCase().replace(/\s+/g, "-")}
                    variant="product"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {item.requestNumber} · Order {item.orderNumber}
                      </p>
                      <h2 className="font-semibold line-clamp-1">{item.productName}</h2>
                    </div>
                    <Badge className={cn("shrink-0", statusTone[item.status] ?? "")}>
                      {item.statusLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">
                    Qty {item.quantity}
                    {item.variantName ? ` · ${item.variantName}` : ""} · Refund{" "}
                    {formatPrice(item.amount)}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Requested {item.date || formatDate(new Date(item.createdAt ?? ""))}
                  </p>
                  {item.pickup?.awbCode ? (
                    <p className="text-xs mt-1">
                      Pickup AWB: <strong>{item.pickup.awbCode}</strong>
                      {item.pickup.courierName ? ` · ${item.pickup.courierName}` : ""}
                    </p>
                  ) : null}
                  {item.status === "refunded" ? (
                    <p className="text-xs text-green-700 mt-1">
                      Refund credited to original payment method (5–7 business days for bank).
                    </p>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" className="shrink-0 self-center" asChild>
                  <Link href={`/dashboard/returns/${item.id}`}>
                    Track
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
