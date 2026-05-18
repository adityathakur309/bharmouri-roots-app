"use client";

import { useState, useEffect, useCallback } from "react";
import { orderApi } from "@/services/api";
import { orderStatusConfig } from "@/lib/order-status";
import { withFallbackArray } from "@/lib/api-fallback";
import { fallbackAdminOrders, type AdminOrderRow } from "@/lib/admin-fallback-data";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Search, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["processing", "shipped", "delivered", "cancelled", "confirmed", "paid"];

function mapApiOrders(
  data: Array<{
    id: string;
    orderNumber: string;
    user?: { name: string; email: string };
    items: unknown[];
    total: number;
    status: string;
    createdAt: string;
    paymentMethod: string;
  }>
): AdminOrderRow[] {
  return data.map((o) => ({
    id: o.orderNumber,
    dbId: o.id,
    customer: o.user?.name ?? "Customer",
    email: o.user?.email ?? "",
    items: o.items.length,
    total: o.total,
    status: o.status,
    date: o.createdAt,
    payment: o.paymentMethod === "cod" ? "COD" : "Razorpay",
  }));
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allOrders, setAllOrders] = useState<AdminOrderRow[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const res = await orderApi.adminList({ limit: 100 });
      const rows = mapApiOrders(
        (res.data ?? []) as Parameters<typeof mapApiOrders>[0]
      );
      const list = withFallbackArray(rows.length ? rows : null, fallbackAdminOrders);
      setAllOrders(list);
      setUsingDemo(!rows.length);
    } catch {
      setAllOrders(fallbackAdminOrders);
      setUsingDemo(true);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const onFocus = () => loadOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadOrders]);

  const updateStatus = async (dbId: string, status: string) => {
    if (usingDemo && dbId.startsWith("demo")) {
      setAllOrders((prev) => prev.map((o) => (o.dbId === dbId ? { ...o, status } : o)));
      toast({ title: "Demo order status updated" });
      return;
    }
    try {
      await orderApi.updateStatus(dbId, { status });
      setAllOrders((prev) => prev.map((o) => (o.dbId === dbId ? { ...o, status } : o)));
      toast({ title: "Order status updated" });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const createShipment = async (dbId: string) => {
    if (usingDemo && dbId.startsWith("demo")) {
      toast({ title: "Demo shipment created" });
      return;
    }
    try {
      await orderApi.createShipment(dbId);
      toast({ title: "Shipment created" });
      loadOrders();
    } catch {
      toast({ title: "Could not create shipment", variant: "destructive" });
    }
  };

  const filtered = allOrders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {usingDemo && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
          Showing demo orders — real orders appear after customers checkout.
        </p>
      )}

      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{allOrders.length} total orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-[hsl(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "processing", "shipped", "delivered"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize",
                statusFilter === s
                  ? "gradient-forest text-white"
                  : "bg-[hsl(var(--card))] border hover:bg-[hsl(var(--muted))]"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]/30 border-b">
              <tr>
                {["Order ID", "Customer", "Date", "Items", "Total", "Payment", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filtered.map((order, i) => {
                const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
                const StatusIcon = status.icon;
                return (
                  <motion.tr
                    key={order.dbId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-[hsl(var(--muted))]/20 transition-colors"
                  >
                    <td className="p-4 font-mono text-xs font-semibold">{order.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{order.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      {formatDate(order.date)}
                    </td>
                    <td className="p-4">{order.items}</td>
                    <td className="p-4 font-bold text-[hsl(var(--primary))]">{formatPrice(order.total)}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--muted))]">{order.payment}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium w-fit whitespace-nowrap ${status.color}`}
                      >
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.dbId, e.target.value)}
                          className="text-xs h-7 rounded-lg border px-1.5 bg-[hsl(var(--background))] max-w-[120px]"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {orderStatusConfig[s]?.label ?? s}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 h-7 px-2"
                          onClick={() => createShipment(order.dbId)}
                          title="Create shipment"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No orders found
          </div>
        )}
        <div className="p-4 border-t flex items-center justify-between text-sm">
          <p className="text-[hsl(var(--muted-foreground))]">
            Showing {filtered.length} of {allOrders.length} orders
          </p>
        </div>
      </div>
    </div>
  );
}
