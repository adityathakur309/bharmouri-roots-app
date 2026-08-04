"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShipmentTimeline } from "@/components/shipping/shipment-timeline";
import { orderApi } from "@/services/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { orderStatusConfig } from "@/lib/order-status";
import { canCreateShipment } from "@/lib/utils/order-transitions";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus } from "@/types/order";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
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
    email: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  courierName?: string;
  awbCode?: string;
  trackingId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  estimatedDelivery?: string;
  shipmentStatus?: string;
  shippingProvider?: string;
  shipmentTimeline?: Array<{
    status: string;
    label: string;
    timestamp?: string;
    description?: string;
  }>;
  user?: { name: string; email: string };
}

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message) || fallback;
  }
  return fallback;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmShip, setConfirmShip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const createShipment = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const res = await orderApi.createShipment(order.id);
      setOrder(res.data as OrderDetail);
      setConfirmShip(false);
      toast({
        title: "Shipment created",
        description: `${order.orderNumber} booked with courier.`,
      });
    } catch (err) {
      toast({
        title: "Shipment failed",
        description: errMessage(err, "Please try again"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <div className="rounded-2xl border bg-[hsl(var(--card))] p-12 text-center">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-semibold">Order not found</p>
        </div>
      </div>
    );
  }

  const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
  const StatusIcon = status.icon;
  const canShip = canCreateShipment(order.status as OrderStatus);
  const hasShipment = Boolean(order.shiprocketShipmentId || order.trackingId);

  const shippingRows: Array<{ label: string; value: string }> = [
    {
      label: "Shipping Status",
      value: order.shipmentStatus
        ? order.shipmentStatus.replace(/_/g, " ")
        : hasShipment
          ? "Created"
          : "Not created",
    },
    {
      label: "Shipping Charge",
      value: formatPrice(order.shippingCharge ?? 0),
    },
    {
      label: "Courier Partner",
      value: order.courierName ?? "—",
    },
    {
      label: "Delivery Availability",
      value: hasShipment || order.status !== "cancelled" ? "Available" : "—",
    },
    {
      label: "Estimated Delivery",
      value: order.estimatedDelivery
        ? `${order.estimatedDelivery} business days`
        : "—",
    },
    {
      label: "Tracking Number",
      value: order.trackingId ?? order.awbCode ?? "—",
    },
    {
      label: "Shipment ID",
      value: order.shiprocketShipmentId ?? "—",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to orders
          </Link>
          <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Placed {formatDate(order.createdAt)}
            {order.user ? ` · ${order.user.name}` : ""}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium self-start ${status.color}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-[hsl(var(--card))] p-5 space-y-4"
          >
            <h2 className="font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-[hsl(var(--primary))]" /> Items
            </h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Qty {item.quantity} · {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border bg-[hsl(var(--card))] p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-[hsl(var(--primary))]" /> Shipping
              </h2>
              <div className="flex flex-wrap gap-2">
                {hasShipment && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setDetailsOpen(true)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Shipment Details
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={!canShip || hasShipment}
                  onClick={() => setConfirmShip(true)}
                  className="gap-1.5"
                  title={
                    hasShipment
                      ? "Shipment already created"
                      : canShip
                        ? "Create shipment"
                        : "Confirm the order before creating a shipment"
                  }
                >
                  <Truck className="w-3.5 h-3.5" />
                  Create Shipment
                </Button>
              </div>
            </div>

            <dl className="grid sm:grid-cols-2 gap-3">
              {shippingRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl bg-[hsl(var(--muted))]/40 px-3 py-2.5"
                >
                  <dt className="text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] font-semibold">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium capitalize">{row.value}</dd>
                </div>
              ))}
            </dl>

            {order.shipmentTimeline && order.shipmentTimeline.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold mb-3">Delivery timeline</p>
                <ShipmentTimeline events={order.shipmentTimeline} />
              </div>
            )}
          </motion.section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border bg-[hsl(var(--card))] p-5 space-y-3">
            <h2 className="font-bold flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" /> Ship to
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{order.shippingAddress.fullName}</p>
              <p className="text-[hsl(var(--muted-foreground))]">
                {order.shippingAddress.addressLine}
              </p>
              <p className="text-[hsl(var(--muted-foreground))]">
                {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                {order.shippingAddress.pincode}
              </p>
              <p className="text-[hsl(var(--muted-foreground))]">
                {order.shippingAddress.phone}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-[hsl(var(--card))] p-5 space-y-2 text-sm">
            <h2 className="font-bold mb-2">Summary</h2>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Shipping</span>
              <span>{formatPrice(order.shippingCharge)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-[hsl(var(--primary))]">{formatPrice(order.total)}</span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] pt-1">
              Payment: {order.paymentMethod === "cod" ? "COD" : "Razorpay"} (
              {order.paymentStatus})
            </p>
          </section>
        </div>
      </div>

      <Dialog open={confirmShip} onOpenChange={(o) => !busy && setConfirmShip(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create shipment for {order.orderNumber}?</DialogTitle>
            <DialogDescription>
              This books the order with the courier. Tracking and AWB details will be
              saved on the order. Prepaid orders must already be paid; COD can ship after confirmation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" disabled={busy} onClick={() => setConfirmShip(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void createShipment()} className="gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Create shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shipment details</DialogTitle>
            <DialogDescription>Courier booking information for this order.</DialogDescription>
          </DialogHeader>
          <dl className="space-y-2 text-sm">
            {[
              ["Courier", order.courierName],
              ["Tracking / AWB", order.trackingId ?? order.awbCode],
              ["Shipment ID", order.shiprocketShipmentId],
              ["Provider order ID", order.shiprocketOrderId],
              ["Status", order.shipmentStatus],
              ["Est. delivery", order.estimatedDelivery],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-4">
                <dt className="text-[hsl(var(--muted-foreground))]">{label}</dt>
                <dd className="font-medium text-right">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
