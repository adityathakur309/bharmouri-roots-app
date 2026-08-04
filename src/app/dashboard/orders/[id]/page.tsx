"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShipmentTimeline } from "@/components/shipping/shipment-timeline";
import { orderApi } from "@/services/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { orderStatusConfig } from "@/lib/order-status";

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
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Qty {item.quantity} · {formatPrice(item.price)}
                </p>
              </div>
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
