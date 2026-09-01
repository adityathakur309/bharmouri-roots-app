"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogImage } from "@/components/shared/catalog-image";
import { refundApi, type RefundRequestItem } from "@/services/api/refund.service";
import { formatDate, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STEPS = [
  "requested",
  "under_review",
  "approved",
  "quality_check",
  "pickup_scheduled",
  "pickup_completed",
  "refund_processing",
  "refunded",
] as const;

function stepIndex(status: string): number {
  if (status === "rejected" || status === "failed") return -1;
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  return idx >= 0 ? idx : 0;
}

export default function ReturnDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<RefundRequestItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await refundApi.getMine(id);
      setItem(res.data);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/returns" className="inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to returns
        </Link>
        <p className="font-semibold">Return request not found</p>
      </div>
    );
  }

  const current = stepIndex(item.status);
  const terminal = item.status === "rejected" || item.status === "failed";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/returns"
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to returns
      </Link>

      <div className="bg-[hsl(var(--card))] border rounded-2xl p-5 space-y-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden border shrink-0">
            <CatalogImage
              src={item.productImage}
              alt={item.productName}
              themeKey={item.productName.toLowerCase().replace(/\s+/g, "-")}
              variant="product"
            />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.requestNumber}</p>
            <h1 className="text-xl font-bold">{item.productName}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Order {item.orderNumber} · Refund {formatPrice(item.amount)}
            </p>
            <Badge className="mt-2">{item.statusLabel}</Badge>
          </div>
        </div>

        {terminal ? (
          <div
            className={cn(
              "rounded-xl p-4 text-sm",
              item.status === "rejected"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-red-50 text-red-800 border border-red-200"
            )}
          >
            {item.status === "rejected"
              ? item.rejectionReason ?? "Return request was rejected."
              : item.refundFailureReason ?? "Refund could not be completed. Our team will retry."}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <h2 className="font-semibold text-sm">Return progress</h2>
            {STEPS.map((step, i) => {
              const done = i <= current;
              const active = i === current;
              return (
                <div key={step} className="flex items-start gap-3">
                  {done ? (
                    <CheckCircle2
                      className={cn(
                        "w-5 h-5 shrink-0",
                        active ? "text-[hsl(var(--primary))]" : "text-green-600"
                      )}
                    />
                  ) : (
                    <Circle className="w-5 h-5 shrink-0 text-gray-300" />
                  )}
                  <div>
                    <p className={cn("text-sm font-medium", !done && "text-[hsl(var(--muted-foreground))]")}>
                      {step.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {item.pickup?.awbCode ? (
          <div className="flex gap-3 items-start rounded-xl bg-[hsl(var(--muted))]/50 p-4">
            <Truck className="w-5 h-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Reverse pickup</p>
              <p>
                AWB: <strong>{item.pickup.awbCode}</strong>
                {item.pickup.courierName ? ` · ${item.pickup.courierName}` : ""}
              </p>
              {item.pickup.scheduledSlot ? (
                <p className="text-[hsl(var(--muted-foreground))]">Slot: {item.pickup.scheduledSlot}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {item.status === "refunded" ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
            Refund of {formatPrice(item.amount)} has been initiated to your original payment method.
            Bank/UPI credit may take 5–7 business days.
            {item.razorpayRefundId ? (
              <span className="block text-xs mt-1 opacity-80">Ref ID: {item.razorpayRefundId}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="bg-[hsl(var(--card))] border rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Activity timeline</h2>
        <div className="space-y-4">
          {(item.timeline ?? []).length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No updates yet.</p>
          ) : (
            (item.timeline ?? []).map((t, i) => (
              <div key={`${t.status}-${i}`} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">{t.label}</p>
                  {t.note ? (
                    <p className="text-[hsl(var(--muted-foreground))]">{t.note}</p>
                  ) : null}
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.date}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Button variant="outline" asChild>
        <Link href={`/dashboard/orders/${item.orderId}`}>View original order</Link>
      </Button>
    </div>
  );
}
