import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { paymentRepository } from "./payment.repository";
import { razorpayClient } from "./razorpay.client";
import { mockPaymentClient } from "./mock-payment.client";
import { invoiceService } from "./invoice.service";
import type { IOrder } from "@/lib/db/models/order.model";
import type { PaymentRecordStatus } from "@/lib/db/models/payment.model";

const LOCK_MS = 2 * 60_000;

export interface CreatePaymentIntentResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
  orderNumber: string;
  isMock?: boolean;
  paymentId: string;
  reused?: boolean;
}

function orderOwnerId(order: IOrder): string {
  const raw = order.userId as unknown;
  if (raw && typeof raw === "object" && "_id" in (raw as object)) {
    return String((raw as { _id: Types.ObjectId })._id);
  }
  return String(order.userId);
}

export class PaymentService {
  /**
   * Create or reuse a Razorpay payment intent with processing lock / idempotency.
   */
  async createPaymentIntent(
    order: IOrder,
    userId: string
  ): Promise<CreatePaymentIntentResult> {
    if (order.paymentMethod !== "razorpay") {
      throw new ValidationError("Order is not a Razorpay payment order");
    }
    if (order.status === "cancelled") {
      throw new ValidationError("Cannot pay for a cancelled order");
    }
    if (order.paymentStatus === "paid") {
      throw new ValidationError("Order already paid");
    }
    if (!["payment_pending", "pending"].includes(order.status)) {
      throw new ValidationError("Order is not awaiting payment");
    }

    const orderId = String(order._id);
    const amountPaise = Math.round(order.total * 100);
    if (amountPaise < 100) {
      throw new ValidationError("Order amount is too low for online payment");
    }

    const active = await paymentRepository.findActiveLock(orderId);
    if (active) {
      if (
        active.status === "awaiting_payment" &&
        active.razorpayOrderId &&
        active.amount === order.total
      ) {
        logger.info("Reusing existing payment intent", {
          orderId,
          paymentId: String(active._id),
        });
        return {
          razorpayOrderId: active.razorpayOrderId,
          amount: amountPaise,
          currency: "INR",
          keyId: razorpayClient.getKeyId(),
          orderId,
          orderNumber: order.orderNumber,
          isMock: razorpayClient.isMockMode(),
          paymentId: String(active._id),
          reused: true,
        };
      }

      if (active.status === "processing") {
        throw new ConflictError(
          "A payment request is already being processed. Please wait a moment and try again."
        );
      }
    }

    const attemptNumber = (await paymentRepository.countAttempts(orderId)) + 1;

    const payment = await paymentRepository.create({
      orderId: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
      amount: order.total,
      currency: "INR",
      method: "razorpay",
      status: "processing",
      attemptNumber,
      lockExpiresAt: new Date(Date.now() + LOCK_MS),
      idempotencyKey: `${orderId}:${attemptNumber}`,
    });

    try {
      const razorpayOrder = await razorpayClient.createOrder(
        amountPaise,
        order.orderNumber,
        { orderId, paymentId: String(payment._id) }
      );

      await paymentRepository.update(String(payment._id), {
        status: "awaiting_payment",
        razorpayOrderId: razorpayOrder.id,
        lockExpiresAt: new Date(Date.now() + LOCK_MS),
      } as Partial<typeof payment>);

      logger.info("Payment intent created", {
        orderId,
        paymentId: String(payment._id),
        razorpayOrderId: razorpayOrder.id,
        attemptNumber,
      });

      return {
        razorpayOrderId: razorpayOrder.id,
        amount: amountPaise,
        currency: "INR",
        keyId: razorpayClient.getKeyId(),
        orderId,
        orderNumber: order.orderNumber,
        isMock: razorpayClient.isMockMode(),
        paymentId: String(payment._id),
      };
    } catch (error) {
      await paymentRepository.update(String(payment._id), {
        status: "failed",
        failureReason:
          error instanceof Error ? error.message : "Failed to create payment",
        failedAt: new Date(),
        lockExpiresAt: new Date(),
      } as Partial<typeof payment>);
      throw error;
    }
  }

  /**
   * Verify Razorpay (or mock) payment with idempotent success handling.
   */
  async verifyPaymentAttempt(
    order: IOrder,
    userId: string,
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      mockOutcome?: "success" | "failed" | "pending";
    }
  ): Promise<{
    outcome: "already_paid" | "paid" | "failed" | "pending" | "cancelled";
    paymentId?: string;
    invoiceNumber?: string;
    failureReason?: string;
  }> {
    const orderId = String(order._id);

    if (orderOwnerId(order) !== userId) {
      throw new NotFoundError("Order not found");
    }

    if (order.paymentStatus === "paid") {
      if (
        order.razorpayPaymentId &&
        order.razorpayPaymentId !== data.razorpayPaymentId
      ) {
        throw new ConflictError("Order already paid with a different payment");
      }
      return { outcome: "already_paid" };
    }

    if (order.status === "cancelled") {
      throw new ValidationError("Cannot verify payment for a cancelled order");
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== data.razorpayOrderId) {
      throw new ValidationError("Payment does not match this order");
    }

    const existingByPaymentId = await paymentRepository.findByRazorpayPaymentId(
      data.razorpayPaymentId
    );
    if (existingByPaymentId) {
      if (String(existingByPaymentId.orderId) !== orderId) {
        throw new ConflictError("Payment already used on another order");
      }
      if (existingByPaymentId.status === "paid") {
        return {
          outcome: "already_paid",
          paymentId: String(existingByPaymentId._id),
        };
      }
    }

    let payment =
      (await paymentRepository.findByRazorpayOrderId(data.razorpayOrderId)) ??
      (await paymentRepository.findLatestByOrderId(orderId));

    if (!payment) {
      payment = await paymentRepository.create({
        orderId: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
        amount: order.total,
        currency: "INR",
        method: "razorpay",
        status: "awaiting_payment",
        attemptNumber: 1,
        razorpayOrderId: data.razorpayOrderId,
        lockExpiresAt: new Date(Date.now() + LOCK_MS),
      });
    }

    const claimed = await paymentRepository.claimForVerification(String(payment._id));
    if (!claimed) {
      const latest = await paymentRepository.findById(String(payment._id));
      if (latest?.status === "paid") {
        return { outcome: "already_paid", paymentId: String(latest._id) };
      }
      throw new ConflictError(
        "Payment verification is already in progress. Please wait."
      );
    }

    if (razorpayClient.isMockMode() && data.mockOutcome) {
      if (data.mockOutcome === "pending") {
        await paymentRepository.update(String(claimed._id), {
          status: "awaiting_payment" as PaymentRecordStatus,
          razorpayOrderId: data.razorpayOrderId,
          lockExpiresAt: new Date(Date.now() + LOCK_MS),
        });
        return { outcome: "pending", paymentId: String(claimed._id) };
      }

      if (data.mockOutcome === "failed") {
        await this.markFailed(String(claimed._id), "Payment failed (demo)");
        return {
          outcome: "failed",
          paymentId: String(claimed._id),
          failureReason: "Payment failed (demo)",
        };
      }
    }

    const valid = razorpayClient.verifySignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature
    );

    if (!valid) {
      await this.markFailed(String(claimed._id), "Invalid payment signature");
      return {
        outcome: "failed",
        paymentId: String(claimed._id),
        failureReason: "Invalid payment signature",
      };
    }

    if (
      razorpayClient.isMockMode() &&
      mockPaymentClient.outcomeFromPaymentId(data.razorpayPaymentId) === "failed"
    ) {
      await this.markFailed(String(claimed._id), "Payment failed (demo)");
      return {
        outcome: "failed",
        paymentId: String(claimed._id),
        failureReason: "Payment failed (demo)",
      };
    }

    try {
      await paymentRepository.update(String(claimed._id), {
        status: "paid",
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
        paidAt: new Date(),
        lockExpiresAt: new Date(),
      });
    } catch (error) {
      const raced = await paymentRepository.findByRazorpayPaymentId(
        data.razorpayPaymentId
      );
      if (raced?.status === "paid") {
        return { outcome: "already_paid", paymentId: String(raced._id) };
      }
      throw error;
    }

    const invoice = await invoiceService.createForOrder({
      orderId,
      paymentId: String(claimed._id),
      userId,
      orderNumber: order.orderNumber,
      amount: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCharge: order.shippingCharge,
      items: order.items.map((i) => ({
        name: i.name,
        slug: i.slug,
        quantity: i.quantity,
        price: i.price,
      })),
      billingAddress: order.shippingAddress,
    });

    logger.info("Payment verified", {
      orderId,
      paymentId: String(claimed._id),
      razorpayPaymentId: data.razorpayPaymentId,
    });

    return {
      outcome: "paid",
      paymentId: String(claimed._id),
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  async markFailed(paymentId: string, reason: string) {
    await paymentRepository.update(paymentId, {
      status: "failed",
      failureReason: reason,
      failedAt: new Date(),
      lockExpiresAt: new Date(),
    });
  }

  async markCancelled(orderId: string, reason = "Payment cancelled by user") {
    const latest = await paymentRepository.findLatestByOrderId(orderId);
    if (!latest || latest.status === "paid") return latest;
    return paymentRepository.update(String(latest._id), {
      status: "cancelled",
      failureReason: reason,
      cancelledAt: new Date(),
      lockExpiresAt: new Date(),
    });
  }

  async createCodPaymentRecord(order: IOrder, userId: string) {
    return paymentRepository.create({
      orderId: order._id as Types.ObjectId,
      userId: new Types.ObjectId(userId),
      amount: order.total,
      currency: "INR",
      method: "cod",
      status: "awaiting_payment",
      attemptNumber: 1,
    });
  }

  async markCodCollected(orderId: string, paymentId?: string) {
    if (paymentId) {
      return paymentRepository.update(paymentId, {
        status: "paid",
        paidAt: new Date(),
        lockExpiresAt: new Date(),
      });
    }
    const latest = await paymentRepository.findLatestByOrderId(orderId);
    if (!latest) return null;
    return paymentRepository.update(String(latest._id), {
      status: "paid",
      paidAt: new Date(),
      lockExpiresAt: new Date(),
    });
  }
}

export const paymentService = new PaymentService();
