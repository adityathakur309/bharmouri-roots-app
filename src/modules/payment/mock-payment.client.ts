import crypto from "crypto";

export type MockPaymentOutcome = "success" | "failed" | "pending";

/**
 * Use live Razorpay whenever usable keys are configured (test or live).
 * Mock only when credentials are missing / unusable.
 */
export function isMockPaymentMode(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (keyId?.startsWith("rzp_") && keySecret && keySecret.length >= 10) {
    return false;
  }

  if (!keyId || !keySecret) return true;
  if (keyId.includes("xxxxx") || keySecret.includes("your_")) return true;

  // Explicit force-mock only when keys are not real rzp_ keys
  return process.env.PAYMENT_MOCK_MODE === "true";
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
