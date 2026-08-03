/** Allowed order status transitions for admin / system updates. */
import type { OrderStatus, PaymentMethod } from "@/types/order";
import { ValidationError } from "@/lib/utils/errors";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["payment_pending", "confirmed", "cancelled"],
  payment_pending: ["paid", "cancelled", "payment_pending"],
  paid: ["confirmed", "cancelled", "processing"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Client-safe helper — allowed next statuses from current status. */
export function getAllowedOrderTransitions(from: string): OrderStatus[] {
  return TRANSITIONS[from as OrderStatus] ?? [];
}

export function assertOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
  paymentMethod?: PaymentMethod
): void {
  if (from === to) return;

  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ValidationError(`Cannot transition order from "${from}" to "${to}"`);
  }

  // Prepaid orders must be paid before confirmation (admin approval)
  if (to === "confirmed" && paymentMethod === "razorpay" && from === "payment_pending") {
    throw new ValidationError("Cannot confirm an unpaid Razorpay order");
  }
}

/** Statuses allowed for Shiprocket booking (after admin approval). */
export function canCreateShipment(status: OrderStatus): boolean {
  return status === "confirmed" || status === "processing";
}
