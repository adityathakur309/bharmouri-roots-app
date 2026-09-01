"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  Package,
  Search,
  Truck,
  X,
  RotateCcw,
  ClipboardCheck,
  Banknote,
} from "lucide-react";
import { refundApi, type RefundRequestItem, type RefundStatus } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn, formatPrice } from "@/lib/utils";
import { normalizeProductImageUrl } from "@/lib/utils/image-url";

const STATUS_TABS: Array<{ id: RefundStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "requested", label: "Requested" },
  { id: "under_review", label: "Under Review" },
  { id: "approved", label: "Approved" },
  { id: "quality_check", label: "QC" },
  { id: "pickup_scheduled", label: "Pickup" },
  { id: "refund_processing", label: "Processing" },
  { id: "refunded", label: "Refunded" },
  { id: "rejected", label: "Rejected" },
  { id: "failed", label: "Failed" },
];

function statusVariant(status: RefundStatus): "green" | "saffron" | "secondary" | "destructive" {
  if (status === "refunded" || status === "approved" || status === "pickup_completed") return "green";
  if (status === "rejected" || status === "failed") return "destructive";
  if (status === "requested" || status === "under_review") return "saffron";
  return "secondary";
}

export default function AdminRefundsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<RefundStatus | "all">("requested");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RefundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RefundRequestItem | null>(null);
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [qcNotes, setQcNotes] = useState("");
  const [skipPickup, setSkipPickup] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await refundApi.adminList({
        status: tab,
        search: search.trim() || undefined,
        limit: 50,
      });
      setItems(res.data ?? []);
    } catch {
      setItems([]);
      toast({ title: "Could not load refunds", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tab, search, toast]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openDetail = async (id: string) => {
    try {
      const res = await refundApi.adminGet(id);
      setSelected(res.data);
      setRejectReason("");
      setQcNotes("");
      setSkipPickup(Boolean(res.data?.skipPickup));
    } catch {
      toast({ title: "Could not open refund", variant: "destructive" });
    }
  };

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setActing(true);
    try {
      await fn();
      toast({ title: success });
      await load();
      if (selected) {
        const res = await refundApi.adminGet(selected.id);
        setSelected(res.data);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Action failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const actions = useMemo(() => {
    if (!selected) return null;
    const s = selected.status;
    return {
      canStartReview: s === "requested",
      canApprove: s === "requested" || s === "under_review",
      canReject:
        s === "requested" ||
        s === "under_review" ||
        s === "approved" ||
        s === "quality_check",
      canQc: s === "approved" || s === "quality_check",
      canSchedule: s === "approved" || s === "quality_check",
      canCompletePickup: s === "pickup_scheduled",
      canInitiate:
        s === "pickup_completed" ||
        s === "failed" ||
        (s === "quality_check" && selected.skipPickup) ||
        s === "refund_processing",
    };
  }, [selected]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refund Management</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Review → QC → Pickup → Razorpay refund
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-9"
            placeholder="Search order / request…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              tab === t.id
                ? "gradient-forest text-white shadow-sm"
                : "bg-[hsl(var(--card))] border hover:bg-[hsl(var(--muted))]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No refund requests"
          description="Customer refund requests will appear here."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => void openDetail(item.id)}
              className="w-full text-left bg-[hsl(var(--card))] border rounded-xl p-3.5 hover:border-[hsl(var(--primary))]/40 transition-colors"
            >
              <div className="flex gap-3">
                {item.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={normalizeProductImageUrl(item.productImage)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 opacity-40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-semibold">{item.requestNumber}</span>
                    <Badge variant={statusVariant(item.status)} className="text-[10px]">
                      {item.statusLabel}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                    {item.orderNumber} · {item.customer?.name ?? "Customer"} · Qty {item.quantity} ·{" "}
                    {formatPrice(item.amount)}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{selected.requestNumber}</span>
                  <Badge variant={statusVariant(selected.status)}>{selected.statusLabel}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    Order & customer
                  </p>
                  <p>
                    <Link
                      href={`/admin/orders/${selected.orderId}`}
                      className="text-[hsl(var(--primary))] hover:underline font-medium"
                    >
                      {selected.orderNumber}
                    </Link>
                  </p>
                  <p>{selected.customer?.name}</p>
                  <p className="text-[hsl(var(--muted-foreground))] text-xs">
                    {selected.customer?.email}
                    {selected.customer?.phone ? ` · ${selected.customer.phone}` : ""}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    Product
                  </p>
                  <p className="font-medium">{selected.productName}</p>
                  {selected.variantName && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Variant: {selected.variantName}
                    </p>
                  )}
                  <p>
                    Qty {selected.quantity} × {formatPrice(selected.unitPrice)} ={" "}
                    <strong>{formatPrice(selected.amount)}</strong>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-3 text-sm space-y-1">
                <p className="font-medium">Reason</p>
                <p className="text-[hsl(var(--foreground))]/80">{selected.reason}</p>
                {selected.customerNotes && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Notes: {selected.customerNotes}
                  </p>
                )}
                {selected.rejectionReason && (
                  <p className="text-xs text-red-600">Rejected: {selected.rejectionReason}</p>
                )}
                {selected.razorpayRefundId && (
                  <p className="text-xs font-mono">Refund ID: {selected.razorpayRefundId}</p>
                )}
                {selected.refundFailureReason && (
                  <p className="text-xs text-red-600">Failure: {selected.refundFailureReason}</p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">
                  Timeline
                </p>
                <ol className="space-y-2 border-l-2 border-[hsl(var(--muted))] ml-2 pl-4">
                  {(selected.timeline ?? []).map((t, i) => (
                    <li key={`${t.status}-${i}`} className="relative text-sm">
                      <span className="absolute -left-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))]" />
                      <p className="font-medium">{t.label}</p>
                      {t.note && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.note}</p>
                      )}
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.date}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {selected.pickup?.pickupId && (
                <div className="rounded-xl border p-3 text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Pickup
                  </p>
                  <p>
                    {selected.pickup.provider} · {selected.pickup.courierName} · ID{" "}
                    {selected.pickup.pickupId}
                  </p>
                  {selected.pickup.trackingId && <p>Tracking: {selected.pickup.trackingId}</p>}
                </div>
              )}

              {/* Admin action panel */}
              <AnimatePresence>
                {actions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 border-t pt-3"
                  >
                    {(actions.canApprove || actions.canReject) && (
                      <div className="space-y-2">
                        <Label className="text-xs">Rejection reason (if rejecting)</Label>
                        <Input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Required when rejecting"
                        />
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={skipPickup}
                            onChange={(e) => setSkipPickup(e.target.checked)}
                          />
                          Skip pickup (e.g. never delivered)
                        </label>
                      </div>
                    )}

                    {actions.canQc && (
                      <div>
                        <Label className="text-xs mb-1.5 block">QC notes</Label>
                        <Input
                          value={qcNotes}
                          onChange={(e) => setQcNotes(e.target.value)}
                          placeholder="Product condition notes"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {actions.canStartReview && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acting}
                          onClick={() =>
                            void run(
                              () => refundApi.review(selected.id, { action: "start_review" }),
                              "Under review"
                            )
                          }
                        >
                          Start review
                        </Button>
                      )}
                      {actions.canApprove && (
                        <Button
                          size="sm"
                          disabled={acting}
                          className="gap-1"
                          onClick={() =>
                            void run(
                              () =>
                                refundApi.review(selected.id, {
                                  action: "approve",
                                  skipPickup,
                                }),
                              "Approved"
                            )
                          }
                        >
                          {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve
                        </Button>
                      )}
                      {actions.canReject && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive"
                          disabled={acting || !rejectReason.trim()}
                          onClick={() =>
                            void run(
                              () =>
                                refundApi.review(selected.id, {
                                  action: "reject",
                                  rejectionReason: rejectReason,
                                }),
                              "Rejected"
                            )
                          }
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      )}
                      {actions.canQc && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={acting}
                            onClick={() =>
                              void run(
                                () =>
                                  refundApi.qualityCheck(selected.id, {
                                    passed: true,
                                    condition: "unopened",
                                    notes: qcNotes || "Passed",
                                  }),
                                "QC passed"
                              )
                            }
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" /> QC Pass
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive"
                            disabled={acting}
                            onClick={() =>
                              void run(
                                () =>
                                  refundApi.qualityCheck(selected.id, {
                                    passed: false,
                                    notes: qcNotes,
                                    rejectionReason: rejectReason || "Failed QC",
                                  }),
                                "QC failed"
                              )
                            }
                          >
                            QC Fail
                          </Button>
                        </>
                      )}
                      {actions.canSchedule && !selected.skipPickup && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={acting}
                          onClick={() =>
                            void run(
                              () => refundApi.schedulePickup(selected.id),
                              "Pickup scheduled"
                            )
                          }
                        >
                          <Truck className="w-3.5 h-3.5" /> Schedule pickup
                        </Button>
                      )}
                      {actions.canCompletePickup && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acting}
                          onClick={() =>
                            void run(
                              () => refundApi.completePickup(selected.id),
                              "Pickup completed"
                            )
                          }
                        >
                          Mark pickup done
                        </Button>
                      )}
                      {actions.canInitiate && (
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={acting}
                          onClick={() =>
                            void run(
                              () => refundApi.initiate(selected.id),
                              "Refund initiated"
                            )
                          }
                        >
                          {acting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Banknote className="w-3.5 h-3.5" />
                          )}
                          Initiate refund
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
