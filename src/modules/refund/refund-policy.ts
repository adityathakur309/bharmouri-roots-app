import { isMockPaymentMode } from "@/modules/payment/mock-payment.client";
import type { IOrder } from "@/lib/db/models/order.model";
import {
  assertCustomerCanRefund,
  getRefundWindowDays,
  refundRequiresDelivery,
} from "@/lib/utils/order-customer-actions";

export type RefundMockOutcome = "success" | "failed" | "pending";

export { getRefundWindowDays, refundRequiresDelivery };

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

export function assertRefundEligible(order: IOrder) {
  assertCustomerCanRefund({
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveredAt: order.deliveredAt,
    updatedAt: order.updatedAt,
  });
}

export function computeOrderRefundPaymentStatus(
  orderTotal: number,
  refundedInr: number
): "paid" | "refunded" {
  if (refundedInr >= orderTotal - 0.01) return "refunded";
  return "paid";
}

export { REFUND_REASON_PRESETS } from "@/lib/constants/refund";
