"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "@/services/api";
import { orderStatusConfig, orderStatusImpact } from "@/lib/order-status";
import { getAllowedOrderTransitions, canCreateShipment } from "@/lib/utils/order-transitions";
import { ADMIN_ORDER_QUEUES, type AdminOrderQueue } from "@/lib/constants/admin-order-queues";
import { useToast } from "@/hooks/use-toast";
import { useListViewMode } from "@/hooks/use-list-view-mode";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Truck, Package, ShoppingBag, ChevronDown, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import type { OrderStatus } from "@/types/order";

export type AdminOrderRow = {
  id: string;
  dbId: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: string;
  date: string;
  payment: string;
};

type PendingAction =
  | { type: "status"; order: AdminOrderRow; nextStatus: OrderStatus }
  | { type: "shipment"; order: AdminOrderRow };

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

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message) || fallback;
  }
  return fallback;
}

function StatusBadgeMenu({
  order,
  onPick,
}: {
  order: AdminOrderRow;
  onPick: (next: OrderStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const status = orderStatusConfig[order.status] ?? orderStatusConfig.processing;
  const StatusIcon = status.icon;
  const options = getAllowedOrderTransitions(order.status);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all min-h-9",
          status.color,
          options.length ? "hover:ring-2 hover:ring-[hsl(var(--primary))]/25 cursor-pointer" : "cursor-default opacity-90"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        title={options.length ? "Change status" : "No further status changes allowed"}
      >
        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{status.label}</span>
        {options.length > 0 && <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />}
      </button>

      <AnimatePresence>
        {open && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 top-full mt-1 z-30 min-w-[180px] rounded-xl border bg-[hsl(var(--card))] shadow-xl p-1"
            role="menu"
          >
            <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] font-semibold">
              Change to
            </p>
            {options.map((s) => {
              const cfg = orderStatusConfig[s] ?? orderStatusConfig.processing;
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm hover:bg-[hsl(var(--muted))] transition-colors"
                  onClick={() => {
                    setOpen(false);
                    onPick(s);
                  }}
                >
                  <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.color)}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<AdminOrderQueue>("review");
  const [allOrders, setAllOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const { viewMode, setViewMode } = useListViewMode();
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.adminList({
        limit: 100,
        queue: tab === "all" ? undefined : tab,
        search: debouncedSearch || undefined,
      });
      const rows = mapApiOrders(
        (res.data ?? []) as Parameters<typeof mapApiOrders>[0]
      );
      setAllOrders(rows);
      setLoadError(false);
    } catch {
      setAllOrders([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const onFocus = () => void loadOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadOrders]);

  const confirmAction = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.type === "status") {
        await orderApi.updateStatus(pending.order.dbId, { status: pending.nextStatus });
        setAllOrders((prev) =>
          prev.map((o) =>
            o.dbId === pending.order.dbId ? { ...o, status: pending.nextStatus } : o
          )
        );
        toast({
          title: "Status updated",
          description: `${pending.order.id} → ${orderStatusConfig[pending.nextStatus]?.label ?? pending.nextStatus}`,
        });
      } else {
        await orderApi.createShipment(pending.order.dbId);
        toast({
          title: "Shipment created",
          description: `${pending.order.id} is now booked with the courier (status: Processing).`,
        });
        await loadOrders();
      }
      setPending(null);
    } catch (err) {
      toast({
        title: pending.type === "shipment" ? "Shipment failed" : "Status update failed",
        description: errMessage(err, "Please try again"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const filtered = allOrders;

  const dialogCopy = (() => {
    if (!pending) return { title: "", description: "" };
    if (pending.type === "shipment") {
      return {
        title: `Create shipment for ${pending.order.id}?`,
        description:
          "This books the order with the courier. The order will move to Processing and tracking/AWB will be assigned. Prepaid orders must already be paid; COD orders can ship after confirmation.",
      };
    }
    const from = orderStatusConfig[pending.order.status]?.label ?? pending.order.status;
    const to = orderStatusConfig[pending.nextStatus]?.label ?? pending.nextStatus;
    const impact =
      orderStatusImpact[pending.nextStatus] ??
      `Order status will change from ${from} to ${to}.`;
    return {
      title: `Change status to “${to}”?`,
      description: `Order ${pending.order.id} is currently “${from}”.\n\n${impact}`,
    };
  })();

  const orderRowActions = (order: AdminOrderRow, { showLabels = false }: { showLabels?: boolean } = {}) => {
    const canShip = canCreateShipment(order.status as OrderStatus);
    return (
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" className="gap-1.5 h-9 px-2.5" asChild>
          <Link href={`/admin/orders/${order.dbId}`} title="View order details">
            <Eye className="w-3.5 h-3.5" />
            <span className={cn("text-xs", showLabels ? "inline" : "hidden lg:inline")}>View</span>
          </Link>
        </Button>
        <Button
          size="sm"
          variant={canShip ? "outline" : "ghost"}
          className="gap-1.5 h-9 px-2.5"
          disabled={!canShip}
          onClick={() => setPending({ type: "shipment", order })}
          title={
            canShip
              ? "Create courier shipment"
              : "Confirm the order first, then create shipment"
          }
        >
          <Truck className="w-3.5 h-3.5" />
          <span className={cn("text-xs", showLabels ? "inline" : "hidden sm:inline")}>Ship</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Amazon-style fulfillment queues — review → confirm → ship → deliver
          </p>
        </div>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AdminOrderQueue)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-1">
          {ADMIN_ORDER_QUEUES.map((q) => (
            <TabsTrigger
              key={q.id}
              value={q.id}
              className="rounded-xl border data-[state=active]:gradient-forest data-[state=active]:text-white px-3 py-2 text-xs sm:text-sm"
            >
              {q.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
          {ADMIN_ORDER_QUEUES.find((q) => q.id === tab)?.description}
        </p>
      </Tabs>

      {loadError ? (
        <EmptyState
          icon={Package}
          title="Could not load orders"
          description="Check your database connection, then try again."
          primaryAction={{ label: "Retry", onClick: () => void loadOrders() }}
        />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : allOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={`No orders in “${ADMIN_ORDER_QUEUES.find((q) => q.id === tab)?.label ?? tab}”`}
          description="Try another queue or refresh when new orders arrive."
          primaryAction={{ label: "Refresh", onClick: () => void loadOrders(), variant: "outline" }}
          secondaryAction={{ label: "View all orders", onClick: () => setTab("all"), variant: "outline" }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order # or customer..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border bg-[hsl(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] self-center">
              {filtered.length} order{filtered.length === 1 ? "" : "s"} in this queue
            </p>
          </div>

          {viewMode === "list" ? (
            <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[hsl(var(--muted))]/30 border-b">
                    <tr>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap">Order ID</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap">Customer</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden md:table-cell">Date</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden lg:table-cell">Items</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap">Total</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden sm:table-cell">Payment</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap">Status</th>
                      <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {filtered.map((order, i) => (
                      <motion.tr
                        key={order.dbId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="hover:bg-[hsl(var(--muted))]/20 transition-colors"
                      >
                        <td className="p-3 sm:p-4 font-mono text-xs font-semibold">{order.id}</td>
                        <td className="p-3 sm:p-4">
                          <div className="min-w-0 max-w-[140px] sm:max-w-none">
                            <p className="font-medium truncate">{order.customer}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{order.email}</p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden md:table-cell">
                          {formatDate(order.date)}
                        </td>
                        <td className="p-3 sm:p-4 hidden lg:table-cell">{order.items}</td>
                        <td className="p-3 sm:p-4 font-bold text-[hsl(var(--primary))] whitespace-nowrap">
                          {formatPrice(order.total)}
                        </td>
                        <td className="p-3 sm:p-4 hidden sm:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--muted))]">
                            {order.payment}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <StatusBadgeMenu
                            order={order}
                            onPick={(nextStatus) =>
                              setPending({ type: "status", order, nextStatus })
                            }
                          />
                        </td>
                        <td className="p-3 sm:p-4">{orderRowActions(order)}</td>
                      </motion.tr>
                    ))}
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
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((order, i) => (
                  <motion.div
                    key={order.dbId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="bg-[hsl(var(--card))] rounded-2xl border p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold">{order.id}</p>
                        <p className="font-medium truncate mt-1">{order.customer}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                          {order.email}
                        </p>
                      </div>
                      <p className="font-bold text-[hsl(var(--primary))] whitespace-nowrap shrink-0">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span>{formatDate(order.date)}</span>
                      <span>·</span>
                      <span>{order.items} item{order.items === 1 ? "" : "s"}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                        {order.payment}
                      </span>
                    </div>
                    <StatusBadgeMenu
                      order={order}
                      onPick={(nextStatus) =>
                        setPending({ type: "status", order, nextStatus })
                      }
                    />
                    <div className="mt-auto pt-2 border-t flex items-center justify-end">
                      {orderRowActions(order, { showLabels: true })}
                    </div>
                  </motion.div>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))] rounded-2xl border">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  No orders found
                </div>
              )}
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Showing {filtered.length} of {allOrders.length} orders
              </p>
            </>
          )}
        </>
      )}

      <Dialog open={!!pending} onOpenChange={(open) => !busy && !open && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-1">
              {dialogCopy.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              variant={pending?.type === "status" && pending.nextStatus === "cancelled" ? "destructive" : "default"}
              onClick={() => void confirmAction()}
              className="gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending?.type === "shipment" ? "Create shipment" : "Confirm change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
