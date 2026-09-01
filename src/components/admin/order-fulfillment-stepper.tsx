"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { orderStatusConfig } from "@/lib/order-status";
import { getAllowedOrderTransitions, canCreateShipment } from "@/lib/utils/order-transitions";
import type { OrderStatus } from "@/types/order";

const FULFILLMENT_STEPS: Array<{
  key: OrderStatus;
  label: string;
  hint: string;
}> = [
  { key: "payment_pending", label: "Order received", hint: "Awaiting payment or review" },
  { key: "paid", label: "Payment confirmed", hint: "Prepaid received" },
  { key: "confirmed", label: "Confirmed", hint: "Approved for fulfillment" },
  { key: "processing", label: "Processing", hint: "Packed / shipment booked" },
  { key: "shipped", label: "Shipped", hint: "Handed to courier" },
  { key: "delivered", label: "Delivered", hint: "Order completed" },
];

function stepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  if (status === "pending") return 0;
  if (status === "payment_pending") return 0;
  if (status === "paid") return 1;
  if (status === "confirmed") return 2;
  if (status === "processing") return 3;
  if (status === "shipped") return 4;
  if (status === "delivered") return 5;
  return 0;
}

function primaryAction(
  status: OrderStatus,
  paymentMethod: string
): { label: string; nextStatus?: OrderStatus; type: "status" | "shipment" } | null {
  if (status === "cancelled" || status === "delivered") return null;

  if (status === "payment_pending" && paymentMethod === "razorpay") {
    return null;
  }

  if (status === "paid" || status === "pending") {
    return { label: "Confirm order", nextStatus: "confirmed", type: "status" };
  }

  if (status === "confirmed") {
    return { label: "Create shipment", type: "shipment" };
  }

  if (status === "processing") {
    return { label: "Mark as shipped", nextStatus: "shipped", type: "status" };
  }

  if (status === "shipped") {
    return { label: "Mark as delivered", nextStatus: "delivered", type: "status" };
  }

  const allowed = getAllowedOrderTransitions(status);
  if (allowed.includes("confirmed")) {
    return { label: "Confirm order", nextStatus: "confirmed", type: "status" };
  }

  return null;
}

export function OrderFulfillmentStepper({
  status,
  paymentMethod,
  paymentStatus,
  busy,
  onAdvance,
  onCreateShipment,
  onCancel,
}: {
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  busy?: boolean;
  onAdvance: (next: OrderStatus) => void;
  onCreateShipment: () => void;
  onCancel: () => void;
}) {
  const current = stepIndex(status);
  const action = primaryAction(status, paymentMethod);
  const cfg = orderStatusConfig[status] ?? orderStatusConfig.processing;
  const canShip = canCreateShipment(status);

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-5">
        <p className="font-semibold text-red-800 dark:text-red-300">Order cancelled</p>
        <p className="text-sm text-red-700/80 mt-1">No further fulfillment actions are available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-[hsl(var(--card))] p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">Fulfillment workflow</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Current: <span className="font-medium text-[hsl(var(--foreground))]">{cfg.label}</span>
            {" · "}
            Payment: {paymentMethod === "cod" ? "COD" : "Prepaid"} ({paymentStatus})
          </p>
        </div>
        {status !== "delivered" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={busy || !getAllowedOrderTransitions(status).includes("cancelled")}
            onClick={onCancel}
          >
            Cancel order
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FULFILLMENT_STEPS.map((step, i) => {
          const done = current >= 0 && i < current;
          const active = i === current;
          return (
            <div
              key={step.key}
              className={cn(
                "rounded-xl border px-3 py-3 flex gap-3 items-start",
                active && "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5",
                done && "border-green-200 bg-green-50/50 dark:bg-green-950/10"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Circle
                  className={cn(
                    "w-5 h-5 shrink-0 mt-0.5",
                    active ? "text-[hsl(var(--primary))]" : "text-gray-300"
                  )}
                />
              )}
              <div>
                <p className={cn("text-sm font-semibold", !done && !active && "text-[hsl(var(--muted-foreground))]")}>
                  {step.label}
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{step.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {action && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            type="button"
            disabled={busy || (action.type === "shipment" && !canShip)}
            onClick={() => {
              if (action.type === "shipment") onCreateShipment();
              else if (action.nextStatus) onAdvance(action.nextStatus);
            }}
            className="gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {action.label}
          </Button>
          {status === "confirmed" && canShip && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] self-center">
              Books courier and moves order to Processing automatically.
            </p>
          )}
        </div>
      )}

      {status === "delivered" && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          This order is complete. Refunds can be managed from the Returns section if needed.
        </p>
      )}
    </div>
  );
}
