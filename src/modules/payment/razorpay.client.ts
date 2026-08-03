import Razorpay from "razorpay";
import crypto from "crypto";
import { AppError } from "@/lib/utils/errors";
import { isMockPaymentMode, mockPaymentClient } from "./mock-payment.client";

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError("Razorpay is not configured", 503, "PAYMENT_NOT_CONFIGURED");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayInstance;
}

function timingSafeEqualString(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export class RazorpayClient {
  isMockMode(): boolean {
    return isMockPaymentMode();
  }

  async createOrder(amountInPaise: number, receipt: string, notes?: Record<string, string>) {
    if (this.isMockMode()) {
      return mockPaymentClient.createOrder(amountInPaise, receipt);
    }
    const razorpay = getRazorpay();
    return razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    });
  }

  verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    if (this.isMockMode()) {
      return mockPaymentClient.verifySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return timingSafeEqualString(expected, razorpaySignature);
  }

  getKeyId(): string {
    if (this.isMockMode()) {
      return mockPaymentClient.getKeyId();
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) throw new AppError("Razorpay is not configured", 503);
    return keyId;
  }
}

export const razorpayClient = new RazorpayClient();
