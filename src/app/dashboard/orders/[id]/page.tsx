"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Package, Truck, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShipmentTimeline } from "@/components/shipping/shipment-timeline";
import { CatalogImage } from "@/components/shared/catalog-image";
import { orderApi, refundApi } from "@/services/api";
import { REFUND_REASON_PRESETS } from "@/lib/constants/refund";
import { formatPrice, formatDate } from "@/lib/utils";
import { orderStatusConfig } from "@/lib/order-status";
import { useToast } from "@/hooks/use-toast";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingCharge: number;
  total: number;
  createdAt: string;
  items: Array<{
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  courierName?: string;
  trackingId?: string;
  awbCode?: string;
  estimatedDelivery?: string;
  shipmentStatus?: string;
  shipmentTimeline?: Array<{
    status: string;
    label: string;
    timestamp?: string;
    description?: string;
  }>;
}

export default function UserOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundItemIndex, setRefundItemIndex] = useState<number | null>(null);
  const [refundQty, setRefundQty] = useState("1");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getById(id);
      setOrder(res.data as OrderDetail);
    } catch {
      setOrder(null);
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
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">Order not found</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/orders">My Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
  const StatusIcon = status.icon;
  const tracking = order.trackingId ?? order.awbCode;
  const canRequestRefund =
    !["cancelled", "payment_pending"].includes(order.status) &&
    (order.paymentStatus === "paid" || order.paymentMethod === "cod") &&
    order.paymentStatus !== "refunded";

  const openRefund = (idx: number) => {
    setRefundItemIndex(idx);
    setRefundQty(String(order.items[idx]?.quantity ?? 1));
    setRefundReason("");
    setRefundNotes("");
  };

  const submitRefund = async () => {
    if (refundItemIndex === null) return;
    if (refundReason.trim().length < 5) {
      toast({
        title: "Please explain the reason (min 5 characters)",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await refundApi.create({
        orderId: order.id,
        itemIndex: refundItemIndex,
        quantity: Number(refundQty) || 1,
        reason: refundReason.trim(),
        customerNotes: refundNotes.trim() || undefined,
      });
      toast({
        title: "Return requested",
        description: "Track progress anytime under My Returns.",
      });
      setRefundItemIndex(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Could not submit request";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const refundItem =
    refundItemIndex !== null ? order.items[refundItemIndex] : null;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Placed on {formatDate(order.createdAt)}
            </p>
            <Link
              href="/dashboard/returns"
              className="text-xs text-[hsl(var(--primary))] hover:underline mt-1 inline-block"
            >
              View my returns →
            </Link>
          </div>
          <span
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-4"
      >
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Truck className="w-4 h-4 text-[hsl(var(--primary))]" /> Shipping
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Info
            label="Shipping status"
            value={
              order.shipmentStatus
                ? order.shipmentStatus.replace(/_/g, " ")
                : status.label
            }
          />
          <Info
            label="Estimated delivery"
            value={
              order.estimatedDelivery
                ? `${order.estimatedDelivery} business days`
                : "—"
            }
          />
          <Info label="Courier partner" value={order.courierName ?? "—"} />
          <Info label="Tracking number" value={tracking ?? "—"} />
          <Info
            label="Shipping charges"
            value={formatPrice(order.shippingCharge ?? 0)}
          />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[hsl(var(--card))] rounded-2xl border p-5"
      >
        <h2 className="font-bold text-sm mb-4">Delivery timeline</h2>
        <ShipmentTimeline events={order.shipmentTimeline ?? []} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden"
      >
        <div className="p-4 border-b font-bold text-sm flex items-center gap-2">
          <Package className="w-4 h-4 text-[hsl(var(--primary))]" /> Items
        </div>
        <div className="p-4 space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                <CatalogImage src={item.image} alt={item.name} variant="product" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Qty {item.quantity} · {formatPrice(item.price)}
                </p>
              </div>
              {canRequestRefund && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1 shrink-0"
                  onClick={() => openRefund(idx)}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Refund
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 flex justify-between text-sm font-bold border-t pt-3 mx-4">
          <span>Total</span>
          <span className="text-[hsl(var(--primary))]">{formatPrice(order.total)}</span>
        </div>
      </motion.section>

      <section className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-2 text-sm">
        <h2 className="font-bold flex items-center gap-2 text-sm mb-1">
          <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" /> Delivery address
        </h2>
        <p className="font-medium">{order.shippingAddress.fullName}</p>
        <p className="text-[hsl(var(--muted-foreground))]">
          {order.shippingAddress.addressLine}
        </p>
        <p className="text-[hsl(var(--muted-foreground))]">
          {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
          {order.shippingAddress.pincode}
        </p>
        <p className="text-[hsl(var(--muted-foreground))]">{order.shippingAddress.phone}</p>
      </section>

      <Dialog
        open={refundItemIndex !== null}
        onOpenChange={(o) => !o && setRefundItemIndex(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request return / refund</DialogTitle>
          </DialogHeader>
          {refundItem && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{refundItem.name}</p>
              <div>
                <Label className="mb-1.5 block text-xs">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={refundItem.quantity}
                  value={refundQty}
                  onChange={(e) => setRefundQty(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Reason *</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {REFUND_REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRefundReason(preset)}
                      className="text-[10px] px-2 py-1 rounded-full border hover:bg-[hsl(var(--muted))]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-[hsl(var(--background))]"
                  placeholder="Why are you requesting a refund?"
                  required
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Additional notes</Label>
                <Input
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Estimated refund:{" "}
                {formatPrice(
                  refundItem.price *
                    Math.min(Number(refundQty) || 1, refundItem.quantity)
                )}{" "}
                (final amount confirmed by admin)
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefundItemIndex(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitRefund()}>
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Submit request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--muted))]/40 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] font-semibold">
        {label}
      </p>
      <p className="mt-0.5 font-medium capitalize">{value}</p>
    </div>
  );
}
