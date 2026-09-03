import { ValidationError } from "@/lib/utils/errors";

/** Minimal order shape for customer cancel / refund checks (API + UI). */
export type CustomerOrderActionInput = {
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  deliveredAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export type ActionEligibility = {
  allowed: boolean;
  reason?: string;
};

export function getRefundWindowDays(): number {
  const n = Number(process.env.REFUND_WINDOW_DAYS ?? 7);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 7;
}

export function refundRequiresDelivery(): boolean {
  const flag = process.env.REFUND_REQUIRE_DELIVERY?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "production";
}

function isPaymentDone(order: CustomerOrderActionInput): boolean {
  return order.paymentStatus === "paid";
}

function withinRefundWindow(order: CustomerOrderActionInput): boolean {
  const anchor = order.deliveredAt ?? order.updatedAt;
  if (!anchor) return false;
  const windowMs = getRefundWindowDays() * 86_400_000;
  return Date.now() - new Date(anchor).getTime() <= windowMs;
}

const PRE_SHIP_CANCEL_STATUSES = new Set([
  "paid",
  "confirmed",
  "processing",
]);

const UNPAID_ABANDON_STATUSES = new Set(["pending", "payment_pending"]);

/**
 * Cancel rules:
 * - Unpaid pending checkout → abandon cancel OK
 * - Paid + not yet shipped → cancel OK
 * - Delivered + payment done + within refund window → cancel OK
 * - Otherwise → not allowed (with clear reason)
 */
export function getCustomerCancelEligibility(
  order: CustomerOrderActionInput
): ActionEligibility {
  if (order.status === "cancelled") {
    return { allowed: false, reason: "This order is already cancelled." };
  }

  if (UNPAID_ABANDON_STATUSES.has(order.status) && !isPaymentDone(order)) {
    return { allowed: true };
  }

  if (order.status === "shipped") {
    return {
      allowed: false,
      reason:
        "Order is already shipped. You can request a refund after delivery if payment is complete and within the return window.",
    };
  }

  if (order.status === "delivered") {
    if (!isPaymentDone(order)) {
      return {
        allowed: false,
        reason: "Cancel / return is available only after payment is completed.",
      };
    }
    if (!withinRefundWindow(order)) {
      return {
        allowed: false,
        reason: `Return window of ${getRefundWindowDays()} days from delivery has passed.`,
      };
    }
    return { allowed: true };
  }

  if (!isPaymentDone(order)) {
    return {
      allowed: false,
      reason: "You can cancel only after payment is completed.",
    };
  }

  if (PRE_SHIP_CANCEL_STATUSES.has(order.status)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "This order cannot be cancelled in its current status.",
  };
}

/**
 * Refund rules:
 * - Payment must be completed (paid)
 * - Paid cancelled orders → refund OK
 * - Delivered within return window → refund OK
 * - If delivery not required: confirmed / processing / shipped / paid also OK
 */
export function getCustomerRefundEligibility(
  order: CustomerOrderActionInput
): ActionEligibility {
  if (!isPaymentDone(order)) {
    return {
      allowed: false,
      reason: "Refund is available only after payment is completed.",
    };
  }

  if (order.status === "cancelled") {
    return { allowed: true };
  }

  if (UNPAID_ABANDON_STATUSES.has(order.status)) {
    return {
      allowed: false,
      reason: "This order is not eligible for a refund yet.",
    };
  }

  if (order.status === "delivered" || order.deliveredAt) {
    if (!withinRefundWindow(order)) {
      return {
        allowed: false,
        reason: `Return window of ${getRefundWindowDays()} days from delivery has passed.`,
      };
    }
    return { allowed: true };
  }

  if (refundRequiresDelivery()) {
    return {
      allowed: false,
      reason:
        "Returns open after delivery. Track your order and try again once delivered, or cancel before shipping if eligible.",
    };
  }

  if (["paid", "confirmed", "processing", "shipped"].includes(order.status)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "This order status does not allow refunds.",
  };
}

export function assertCustomerCanCancel(order: CustomerOrderActionInput): void {
  const result = getCustomerCancelEligibility(order);
  if (!result.allowed) {
    throw new ValidationError(result.reason ?? "Cannot cancel this order");
  }
}

export function assertCustomerCanRefund(order: CustomerOrderActionInput): void {
  const result = getCustomerRefundEligibility(order);
  if (!result.allowed) {
    throw new ValidationError(result.reason ?? "Cannot refund this order");
  }
}
