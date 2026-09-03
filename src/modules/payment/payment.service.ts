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

    // Live: confirm payment entity status with Razorpay after signature check
    if (!razorpayClient.isMockMode()) {
      try {
        const remote = await razorpayClient.fetchPayment(data.razorpayPaymentId);
        const status = String((remote as { status?: string }).status ?? "");
        if (status !== "captured" && status !== "authorized") {
          await this.markFailed(
            String(claimed._id),
            `Payment status is ${status || "unknown"}`
          );
          return {
            outcome: "failed",
            paymentId: String(claimed._id),
            failureReason: `Payment status is ${status || "unknown"}`,
          };
        }
      } catch (error) {
        logger.warn("Razorpay payment fetch failed after valid signature", {
          paymentId: data.razorpayPaymentId,
          message: error instanceof Error ? error.message : String(error),
        });
        // Signature is valid — continue; webhook can reconcile if needed
      }
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

  /**
   * Process Razorpay webhook events (payment.captured / payment.failed / refund.*).
   * Idempotent — safe to retry.
   */
  async handleWebhookEvent(event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
          amount?: number;
          error_description?: string;
        };
      };
      refund?: {
        entity?: {
          id?: string;
          payment_id?: string;
          amount?: number;
          status?: string;
        };
      };
    };
  }) {
    const eventName = event.event ?? "";
    const paymentEntity = event.payload?.payment?.entity;
    const refundEntity = event.payload?.refund?.entity;

    if (eventName === "payment.captured" && paymentEntity?.id) {
      const existing = await paymentRepository.findByRazorpayPaymentId(
        paymentEntity.id
      );
      if (existing?.status === "paid") {
        return { handled: true, outcome: "already_paid" as const };
      }

      const byOrder = paymentEntity.order_id
        ? await paymentRepository.findByRazorpayOrderId(paymentEntity.order_id)
        : null;
      const payment = existing ?? byOrder;
      if (!payment) {
        logger.warn("Webhook payment.captured with unknown payment", {
          razorpayPaymentId: paymentEntity.id,
          razorpayOrderId: paymentEntity.order_id,
        });
        return { handled: false, outcome: "unknown_payment" as const };
      }

      await paymentRepository.update(String(payment._id), {
        status: "paid",
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id ?? payment.razorpayOrderId,
        paidAt: new Date(),
        lockExpiresAt: new Date(),
        metadata: {
          ...(payment.metadata ?? {}),
          webhookEvent: eventName,
        },
      });

      const { orderRepository } = await import("@/modules/order/order.repository");
      const orderId = String(payment.orderId);
      const order = await orderRepository.findById(orderId);
      if (order && order.paymentStatus !== "paid") {
        const { decrementStock } = await import("@/modules/order/inventory.service");
        if (!order.stockDecremented) {
          await decrementStock(
            order.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              name: i.name,
            }))
          );
        }
        await orderRepository.update(orderId, {
          paymentStatus: "paid",
          status:
            order.status === "payment_pending" || order.status === "pending"
              ? "confirmed"
              : order.status,
          paidAt: new Date(),
          confirmedAt: order.confirmedAt ?? new Date(),
          razorpayPaymentId: paymentEntity.id,
          stockDecremented: true,
        });
      }

      return { handled: true, outcome: "paid" as const };
    }

    if (eventName === "payment.failed" && paymentEntity?.id) {
      const payment =
        (await paymentRepository.findByRazorpayPaymentId(paymentEntity.id)) ??
        (paymentEntity.order_id
          ? await paymentRepository.findByRazorpayOrderId(paymentEntity.order_id)
          : null);
      if (payment && payment.status !== "paid") {
        await this.markFailed(
          String(payment._id),
          paymentEntity.error_description || "Payment failed (webhook)"
        );
      }
      return { handled: true, outcome: "failed" as const };
    }

    if (
      (eventName === "refund.processed" ||
        eventName === "refund.created" ||
        eventName === "refund.failed") &&
      refundEntity?.payment_id
    ) {
      const payment = await paymentRepository.findByRazorpayPaymentId(
        refundEntity.payment_id
      );
      const refundPaise = Number(refundEntity.amount ?? 0);
      const refundId = refundEntity.id;
      const refundStatus = String(refundEntity.status ?? "");

      if (payment) {
        const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
        const priorRefunded = Number(metadata.refundedAmountPaise ?? 0);
        const totalPaise = Math.round(payment.amount * 100);
        const refunds = Array.isArray(metadata.refunds)
          ? [...(metadata.refunds as Array<Record<string, unknown>>)]
          : [];
        const alreadyLogged = refunds.some((r) => r.id === refundId);
        const nextRefunded =
          eventName === "refund.failed"
            ? priorRefunded
            : alreadyLogged
              ? priorRefunded
              : priorRefunded + refundPaise;

        if (!alreadyLogged && eventName !== "refund.failed") {
          refunds.push({
            id: refundId,
            amount: refundPaise,
            status: refundStatus,
            at: new Date().toISOString(),
          });
        }

        await paymentRepository.update(String(payment._id), {
          status: nextRefunded >= totalPaise ? "refunded" : "paid",
          metadata: {
            ...metadata,
            refundId,
            refundAmount: refundPaise,
            refundedAmountPaise: nextRefunded,
            refunds,
            webhookEvent: eventName,
          },
        });

        const { orderRepository } = await import("@/modules/order/order.repository");
        const order = await orderRepository.findById(String(payment.orderId));
        if (order) {
          const refundedInr = nextRefunded / 100;
          const { computeOrderRefundPaymentStatus } = await import(
            "@/modules/refund/refund-policy"
          );
          await orderRepository.update(String(payment.orderId), {
            paymentStatus: computeOrderRefundPaymentStatus(order.total, refundedInr),
          });
        }
      }

      const requestNumber =
        (refundEntity as { notes?: { requestNumber?: string } }).notes?.requestNumber;
      if (requestNumber) {
        const { RefundRequest } = await import("@/lib/db/models/refund-request.model");
        const req = await RefundRequest.findOne({ requestNumber });
        if (req) {
          if (eventName === "refund.failed") {
            if (req.status === "refund_processing") {
              await RefundRequest.findByIdAndUpdate(req._id, {
                $set: {
                  status: "failed",
                  refundFailureReason: "Refund failed at payment gateway",
                },
                $push: {
                  timeline: {
                    status: "failed",
                    note: "Refund failed (webhook)",
                    actorRole: "system",
                    at: new Date(),
                  },
                },
              });
            }
          } else if (
            (eventName === "refund.processed" || refundStatus === "processed") &&
            req.status === "refund_processing"
          ) {
            await RefundRequest.findByIdAndUpdate(req._id, {
              $set: {
                status: "refunded",
                razorpayRefundId: refundId,
                refundAmountPaise: refundPaise,
                refundedAt: new Date(),
                refundFailureReason: undefined,
              },
              $push: {
                timeline: {
                  status: "refunded",
                  note: "Refund processed by payment gateway",
                  actorRole: "system",
                  at: new Date(),
                },
              },
            });
          }
        }
      }

      return {
        handled: true,
        outcome: eventName === "refund.failed" ? ("failed" as const) : ("refunded" as const),
      };
    }

    return { handled: false, outcome: "ignored" as const };
  }

  async refundOrderPayment(
    orderId: string,
    options?: { amountInr?: number; reason?: string; requestNumber?: string }
  ) {
    const latest = await paymentRepository.findLatestByOrderId(orderId);
    if (!latest) throw new NotFoundError("Payment not found");
    if (latest.method !== "razorpay") {
      throw new ValidationError("Only Razorpay payments can be refunded online");
    }
    if (!["paid", "refunded"].includes(latest.status)) {
      throw new ValidationError("Payment is not in a refundable state");
    }
    if (!latest.razorpayPaymentId) {
      throw new ValidationError("Missing Razorpay payment id");
    }

    const metadata = (latest.metadata ?? {}) as Record<string, unknown>;
    const totalPaise = Math.round(latest.amount * 100);
    const priorRefundedPaise = Number(metadata.refundedAmountPaise ?? 0);
    const remainingPaise = totalPaise - priorRefundedPaise;

    if (remainingPaise <= 0) {
      const existingRefundId = metadata.refundId as string | undefined;
      return {
        alreadyRefunded: true as const,
        paymentId: String(latest._id),
        refundId: existingRefundId,
        amountPaise: priorRefundedPaise,
        fullyRefunded: true,
      };
    }

    const receipt = options?.requestNumber;
    const refunds = Array.isArray(metadata.refunds)
      ? (metadata.refunds as Array<{ receipt?: string; id?: string; amount?: number }>)
      : [];
    if (receipt) {
      const dup = refunds.find((r) => r.receipt === receipt);
      if (dup?.id) {
        return {
          alreadyRefunded: false as const,
          paymentId: String(latest._id),
          refundId: dup.id,
          amountPaise: dup.amount ?? 0,
          fullyRefunded: priorRefundedPaise >= totalPaise,
        };
      }
    }

    const amountPaise =
      options?.amountInr !== undefined
        ? Math.round(options.amountInr * 100)
        : remainingPaise;

    if (amountPaise <= 0 || amountPaise > remainingPaise + 1) {
      throw new ValidationError("Invalid refund amount");
    }

    const refundNotes: Record<string, string> = {};
    if (options?.reason) refundNotes.reason = options.reason;
    if (options?.requestNumber) {
      refundNotes.requestNumber = options.requestNumber;
      refundNotes.receipt = options.requestNumber;
    }

    const refund = await razorpayClient.refundPayment(
      latest.razorpayPaymentId,
      amountPaise,
      Object.keys(refundNotes).length ? refundNotes : undefined
    );

    const refundId = (refund as { id?: string }).id;
    const refundStatus = String((refund as { status?: string }).status ?? "processed");
    if (refundStatus === "failed") {
      throw new ValidationError("Payment gateway rejected the refund");
    }

    const nextRefundedPaise =
      refundStatus === "pending" ? priorRefundedPaise : priorRefundedPaise + amountPaise;

    const nextRefunds = [
      ...refunds,
      {
        id: refundId,
        amount: amountPaise,
        receipt,
        status: refundStatus,
        at: new Date().toISOString(),
      },
    ];

    await paymentRepository.update(String(latest._id), {
      status: nextRefundedPaise >= totalPaise ? "refunded" : "paid",
      metadata: {
        ...metadata,
        refundId,
        refundAmount: amountPaise,
        refundedAmountPaise: nextRefundedPaise,
        refunds: nextRefunds,
        refundReason: options?.reason,
        refundedAt: new Date().toISOString(),
      },
    });

    return {
      alreadyRefunded: false as const,
      paymentId: String(latest._id),
      refundId,
      amountPaise,
      fullyRefunded: nextRefundedPaise >= totalPaise,
      pending: refundStatus === "pending",
    };
  }
}

export const paymentService = new PaymentService();
