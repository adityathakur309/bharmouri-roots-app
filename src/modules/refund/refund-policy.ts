import { isMockPaymentMode } from "@/modules/payment/mock-payment.client";
import type { IOrder } from "@/lib/db/models/order.model";
import { ValidationError } from "@/lib/utils/errors";

export type RefundMockOutcome = "success" | "failed" | "pending";

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

/**
 * Mock refunds when REFUND_MOCK_MODE=true, or when unset and payment mock is on.
 * Set REFUND_MOCK_MODE=false to use live Razorpay refunds (test or live keys).
 */
export function isRefundMockMode(): boolean {
  const explicit = process.env.REFUND_MOCK_MODE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return isMockPaymentMode();
}

export function getRefundMockOutcome(receipt?: string): RefundMockOutcome {
  const env = process.env.REFUND_MOCK_OUTCOME?.trim().toLowerCase();
  if (env === "failed" || env === "pending" || env === "success") {
    return env;
  }
  if (receipt?.includes("_fail") || receipt?.includes("FAIL")) return "failed";
  if (receipt?.includes("_pending") || receipt?.includes("PENDING")) return "pending";
  return "success";
}

const RETURNABLE_STATUSES = new Set([
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "paid",
]);

export function assertRefundEligible(order: IOrder) {
  if (["cancelled", "payment_pending", "pending"].includes(order.status)) {
    throw new ValidationError("This order is not eligible for a return yet");
  }

  if (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid") {
    throw new ValidationError("Order payment is not eligible for refund");
  }

  if (refundRequiresDelivery()) {
    if (!order.deliveredAt && order.status !== "delivered") {
      throw new ValidationError(
        "Returns open after delivery. Track your order and try again once delivered."
      );
    }
    const anchor = order.deliveredAt ?? order.updatedAt;
    const windowMs = getRefundWindowDays() * 86_400_000;
    if (Date.now() - new Date(anchor).getTime() > windowMs) {
      throw new ValidationError(
        `Return window of ${getRefundWindowDays()} days from delivery has passed`
      );
    }
  } else if (!RETURNABLE_STATUSES.has(order.status)) {
    throw new ValidationError("This order status does not allow returns");
  }
}

export function computeOrderRefundPaymentStatus(
  orderTotal: number,
  refundedInr: number
): "paid" | "refunded" {
  if (refundedInr >= orderTotal - 0.01) return "refunded";
  return "paid";
}

export { REFUND_REASON_PRESETS } from "@/lib/constants/refund";
