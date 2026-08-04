import crypto from "crypto";
import { AppError } from "@/lib/utils/errors";

export type MockPaymentOutcome = "success" | "failed" | "pending";

function hasUsableRazorpayKeys(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(
    keyId?.startsWith("rzp_") && keySecret && keySecret.length >= 10
  );
}

/**
 * Mock payments only outside production, or when PAYMENT_MOCK_MODE=true.
 * Production is fail-closed: missing keys throw instead of silently mocking.
 */
export function isMockPaymentMode(): boolean {
  if (process.env.PAYMENT_MOCK_MODE === "true") {
    if (process.env.NODE_ENV === "production") {
      // Allow explicit mock only when deployed as staging with intentional flag
      return true;
    }
    return true;
  }

  if (hasUsableRazorpayKeys()) return false;

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return true;
}

/** Call before creating/verifying payments in production. */
export function assertPaymentGatewayReady() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.PAYMENT_MOCK_MODE === "true") return;
  if (!hasUsableRazorpayKeys()) {
    throw new AppError(
      "Payment gateway is not configured for production",
      503,
      "PAYMENT_NOT_CONFIGURED"
    );
  }
}

/** Reject mock signatures when live Razorpay is required. */
export function assertLivePaymentSignatureAllowed(signature: string) {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.PAYMENT_MOCK_MODE === "true") return;
  if (signature === "mock_success" || signature.startsWith("mock_")) {
    throw new AppError(
      "Invalid payment signature",
      400,
      "PAYMENT_SIGNATURE_INVALID"
    );
  }
}

export class MockPaymentClient {
  getKeyId(): string {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_mock_demo";
  }

  async createOrder(amountInPaise: number, receipt: string) {
    const id = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    return {
      id,
      entity: "order",
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: "INR",
      receipt,
      status: "created",
      attempts: 0,
      notes: {},
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    if (razorpaySignature === "mock_success") return true;
    if (razorpaySignature.startsWith("mock_")) {
      return razorpaySignature === `mock_${this.outcomeFromPaymentId(razorpayPaymentId)}`;
    }
    const expected = crypto
      .createHmac("sha256", "mock_secret")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(razorpaySignature);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  outcomeFromPaymentId(paymentId: string): MockPaymentOutcome {
    if (paymentId.includes("_failed_")) return "failed";
    if (paymentId.includes("_pending_")) return "pending";
    return "success";
  }

  buildMockPayment(paymentId: string) {
    return {
      razorpayPaymentId: paymentId,
      razorpaySignature: `mock_${this.outcomeFromPaymentId(paymentId)}`,
    };
  }
}

export const mockPaymentClient = new MockPaymentClient();
