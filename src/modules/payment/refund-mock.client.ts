import crypto from "crypto";
import {
  getRefundMockOutcome,
  isRefundMockMode,
  type RefundMockOutcome,
} from "@/modules/refund/refund-policy";

export interface MockRefundResult {
  id: string;
  payment_id: string;
  amount: number;
  currency: "INR";
  status: "processed" | "pending" | "failed";
  receipt?: string;
}

export class RefundMockClient {
  refundPayment(
    razorpayPaymentId: string,
    amountPaise: number,
    receipt?: string
  ): MockRefundResult {
    const outcome: RefundMockOutcome = getRefundMockOutcome(receipt);
    const id = `rfnd_mock_${crypto.randomBytes(6).toString("hex")}`;

    if (outcome === "failed") {
      throw new Error("Mock refund failed (REFUND_MOCK_OUTCOME=failed or receipt contains _fail)");
    }

    return {
      id,
      payment_id: razorpayPaymentId,
      amount: amountPaise,
      currency: "INR",
      status: outcome === "pending" ? "pending" : "processed",
      receipt,
    };
  }
}

export const refundMockClient = new RefundMockClient();

export { isRefundMockMode };
