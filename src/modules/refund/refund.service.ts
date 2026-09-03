import { Types } from "mongoose";
import { Order } from "@/lib/db/models";
import {
  RefundRequest,
  type RefundRequestStatus,
} from "@/lib/db/models/refund-request.model";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { formatDate } from "@/lib/utils";
import type {
  CreateRefundRequestInput,
  AdminRefundQueryInput,
  ReviewRefundInput,
  QualityCheckInput,
  SchedulePickupInput,
  CompletePickupInput,
  InitiateRefundInput,
} from "@/lib/validators/refund.validator";
import { assertRefundTransition, REFUND_STATUS_LABELS } from "./refund-transitions";
import { buildRefundMeta, refundRepository } from "./refund.repository";
import {
  assertRefundEligible,
  computeOrderRefundPaymentStatus,
} from "./refund-policy";
import { customAlphabet } from "nanoid";

const requestNumber = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function mapRefund(doc: unknown) {
  const d = doc as Record<string, unknown>;
  const user = d.userId as Record<string, unknown> | undefined;
  const timeline = Array.isArray(d.timeline)
    ? (d.timeline as Array<Record<string, unknown>>).map((t) => ({
        status: t.status as RefundRequestStatus,
        label:
          REFUND_STATUS_LABELS[t.status as RefundRequestStatus] ?? String(t.status),
        note: t.note ? String(t.note) : undefined,
        actorRole: t.actorRole as string | undefined,
        at: t.at,
        date: t.at ? formatDate(new Date(t.at as string)) : "",
      }))
    : [];

  return {
    id: String(d._id),
    requestNumber: String(d.requestNumber),
    orderId: String(d.orderId),
    orderNumber: String(d.orderNumber),
    userId: user?._id ? String(user._id) : String(d.userId),
    customer: user
      ? {
          name: user.name ? String(user.name) : undefined,
          email: user.email ? String(user.email) : undefined,
          phone: user.phone ? String(user.phone) : undefined,
        }
      : undefined,
    productId: d.productId ? String(d.productId) : undefined,
    productName: String(d.productName),
    productImage: d.productImage ? String(d.productImage) : undefined,
    variantName: d.variantName ? String(d.variantName) : undefined,
    quantity: Number(d.quantity),
    unitPrice: Number(d.unitPrice),
    amount: Number(d.amount),
    reason: String(d.reason),
    customerNotes: d.customerNotes ? String(d.customerNotes) : undefined,
    status: d.status as RefundRequestStatus,
    statusLabel:
      REFUND_STATUS_LABELS[d.status as RefundRequestStatus] ?? String(d.status),
    rejectionReason: d.rejectionReason ? String(d.rejectionReason) : undefined,
    adminNotes: d.adminNotes ? String(d.adminNotes) : undefined,
    qualityCheck: d.qualityCheck ?? {},
    pickup: d.pickup ?? {},
    skipPickup: Boolean(d.skipPickup),
    razorpayRefundId: d.razorpayRefundId ? String(d.razorpayRefundId) : undefined,
    razorpayPaymentId: d.razorpayPaymentId
      ? String(d.razorpayPaymentId)
      : undefined,
    refundAmountPaise:
      d.refundAmountPaise != null ? Number(d.refundAmountPaise) : undefined,
    refundFailureReason: d.refundFailureReason
      ? String(d.refundFailureReason)
      : undefined,
    refundedAt: d.refundedAt,
    timeline,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    date: d.createdAt ? formatDate(new Date(d.createdAt as string)) : "",
  };
}

async function setAndTimeline(
  id: string,
  fromStatus: RefundRequestStatus,
  to: RefundRequestStatus,
  opts: {
    actorId?: string;
    actorRole?: "user" | "admin" | "system";
    note?: string;
    extra?: Record<string, unknown>;
  }
) {
  assertRefundTransition(fromStatus, to);
  await RefundRequest.findByIdAndUpdate(id, {
    $set: { status: to, ...(opts.extra ?? {}) },
    $push: {
      timeline: {
        status: to,
        note: opts.note,
        actorId: opts.actorId ? new Types.ObjectId(opts.actorId) : undefined,
        actorRole: opts.actorRole,
        at: new Date(),
      },
    },
  });
  return refundRepository.findById(id);
}

export class RefundService {
  async create(userId: string, input: CreateRefundRequestInput) {
    const data = sanitizeObject({ ...input });
    const order = await Order.findOne({
      _id: data.orderId,
      userId: new Types.ObjectId(userId),
    });
    if (!order) throw new NotFoundError("Order not found");

    assertRefundEligible(order);

    if (order.paymentStatus !== "paid") {
      throw new ValidationError("Refund is available only after payment is completed.");
    }

    const item = order.items[data.itemIndex];
    if (!item) throw new ValidationError("Invalid order item");
    if (data.quantity > item.quantity) {
      throw new ValidationError("Refund quantity exceeds purchased quantity");
    }

    const amount = Math.round(item.price * data.quantity * 100) / 100;

    const existing = await refundRepository.findActiveForOrderItem(
      String(order._id),
      item.name,
      item.variantName
    );
    if (existing) {
      throw new ConflictError("A refund request already exists for this item");
    }

    const sums = await refundRepository.sumActiveAmountsForOrder(String(order._id));
    const already = sums[0]?.total ?? 0;
    if (already + amount > order.total + 0.01) {
      throw new ValidationError("Refund amount would exceed order total");
    }

    const reqNo = `RF-${new Date().getFullYear()}-${requestNumber()}`;
    const created = await refundRepository.create({
      requestNumber: reqNo,
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: new Types.ObjectId(userId),
      productId: item.productId,
      productName: item.name,
      productImage: item.image,
      variantName: item.variantName,
      quantity: data.quantity,
      unitPrice: item.price,
      amount,
      reason: data.reason,
      customerNotes: data.customerNotes,
      status: "requested",
      qualityCheck: { evidenceImages: data.evidenceImages ?? [] },
      pickup: {
        addressLine: order.shippingAddress.addressLine,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        phone: order.shippingAddress.phone,
      },
      skipPickup: false,
      timeline: [
        {
          status: "requested",
          note: "Customer submitted refund request",
          actorId: new Types.ObjectId(userId),
          actorRole: "user",
          at: new Date(),
        },
      ],
    });

    return mapRefund(await refundRepository.findById(String(created._id)));
  }

  async listMine(userId: string, page = 1, limit = 20) {
    const [rows, total] = await refundRepository.findByUser(userId, page, limit);
    return {
      refunds: rows.map(mapRefund),
      meta: buildRefundMeta(page, limit, total),
    };
  }

  async listAdmin(query: AdminRefundQueryInput) {
    const [rows, total] = await refundRepository.findAdmin(query);
    return {
      refunds: rows.map(mapRefund),
      meta: buildRefundMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string, userId?: string, isAdmin = false) {
    const doc = await refundRepository.findById(id);
    if (!doc) throw new NotFoundError("Refund request not found");
    const ownerId =
      typeof doc.userId === "object" && doc.userId && "_id" in doc.userId
        ? String((doc.userId as { _id: Types.ObjectId })._id)
        : String(doc.userId);
    if (!isAdmin && ownerId !== userId) {
      throw new ForbiddenError("Access denied");
    }
    return mapRefund(doc);
  }

  async review(id: string, adminId: string, input: ReviewRefundInput) {
    let doc = await refundRepository.findById(id);
    if (!doc) throw new NotFoundError("Refund request not found");

    if (input.action === "start_review") {
      return mapRefund(
        await setAndTimeline(id, doc.status, "under_review", {
          actorId: adminId,
          actorRole: "admin",
          note: input.adminNotes ?? "Moved to under review",
          extra: input.adminNotes ? { adminNotes: input.adminNotes } : {},
        })
      );
    }

    if (input.action === "reject") {
      if (!input.rejectionReason?.trim()) {
        throw new ValidationError("Rejection reason is required");
      }
      if (doc.status === "requested") {
        doc = (await setAndTimeline(id, "requested", "under_review", {
          actorId: adminId,
          actorRole: "admin",
          note: "Review started before rejection",
        }))!;
      }
      return mapRefund(
        await setAndTimeline(id, doc.status, "rejected", {
          actorId: adminId,
          actorRole: "admin",
          note: input.rejectionReason,
          extra: {
            rejectionReason: input.rejectionReason,
            adminNotes: input.adminNotes,
          },
        })
      );
    }

    // approve
    if (doc.status === "requested") {
      doc = (await setAndTimeline(id, "requested", "under_review", {
        actorId: adminId,
        actorRole: "admin",
        note: "Review started",
      }))!;
    }
    return mapRefund(
      await setAndTimeline(id, doc.status, "approved", {
        actorId: adminId,
        actorRole: "admin",
        note: input.adminNotes ?? "Refund approved",
        extra: {
          adminNotes: input.adminNotes,
          skipPickup: Boolean(input.skipPickup),
        },
      })
    );
  }

  async qualityCheck(id: string, adminId: string, input: QualityCheckInput) {
    let doc = await refundRepository.findById(id);
    if (!doc) throw new NotFoundError("Refund request not found");

    if (doc.status === "approved") {
      doc = (await setAndTimeline(id, "approved", "quality_check", {
        actorId: adminId,
        actorRole: "admin",
        note: "Quality check started",
      }))!;
    }
    if (doc.status !== "quality_check") {
      throw new ValidationError("Refund must be approved before quality check");
    }

    const qcPayload = {
      ...(typeof doc.qualityCheck === "object" ? doc.qualityCheck : {}),
      passed: input.passed,
      condition: input.condition,
      notes: input.notes,
      evidenceImages:
        input.evidenceImages ??
        (doc.qualityCheck as { evidenceImages?: string[] })?.evidenceImages,
      checkedAt: new Date(),
      checkedBy: new Types.ObjectId(adminId),
    };

    if (!input.passed) {
      return mapRefund(
        await setAndTimeline(id, "quality_check", "rejected", {
          actorId: adminId,
          actorRole: "admin",
          note: input.rejectionReason ?? "Failed quality check",
          extra: {
            rejectionReason: input.rejectionReason ?? "Failed quality check",
            qualityCheck: qcPayload,
          },
        })
      );
    }

    await RefundRequest.findByIdAndUpdate(id, {
      $set: { qualityCheck: qcPayload },
      $push: {
        timeline: {
          status: "quality_check",
          note: input.notes ?? "Quality check passed",
          actorId: new Types.ObjectId(adminId),
          actorRole: "admin",
          at: new Date(),
        },
      },
    });

    doc = (await refundRepository.findById(id))!;

    if (doc.skipPickup) {
      return mapRefund(
        await setAndTimeline(id, "quality_check", "refund_processing", {
          actorId: adminId,
          actorRole: "admin",
          note: "Pickup skipped — ready to initiate refund",
        })
      );
    }

    return mapRefund(doc);
  }

  async schedulePickup(id: string, adminId: string, input: SchedulePickupInput) {
    let doc = await refundRepository.findById(id);
    if (!doc) throw new NotFoundError("Refund request not found");
    if (doc.skipPickup) {
      throw new ValidationError("This refund skips physical pickup");
    }

    if (doc.status === "approved") {
      doc = (await setAndTimeline(id, "approved", "quality_check", {
        actorId: adminId,
        actorRole: "admin",
        note: "Quality check auto-started for pickup",
        extra: {
          qualityCheck: {
            ...(typeof doc.qualityCheck === "object" ? doc.qualityCheck : {}),
            passed: true,
            notes: "Auto-passed for pickup scheduling",
            checkedAt: new Date(),
            checkedBy: new Types.ObjectId(adminId),
          },
        },
      }))!;
    }

    if (doc.status !== "quality_check") {
      throw new ValidationError(
        "Complete approval and quality check before scheduling pickup"
      );
    }

    const order = await Order.findById(doc.orderId);
    if (!order) throw new NotFoundError("Order not found");

    const addr = {
      fullName: order.shippingAddress.fullName,
      phone: input.phone ?? doc.pickup?.phone ?? order.shippingAddress.phone,
      email: order.shippingAddress.email,
      addressLine:
        input.addressLine ??
        doc.pickup?.addressLine ??
        order.shippingAddress.addressLine,
      city: input.city ?? doc.pickup?.city ?? order.shippingAddress.city,
      state: input.state ?? doc.pickup?.state ?? order.shippingAddress.state,
      pincode: input.pincode ?? doc.pickup?.pincode ?? order.shippingAddress.pincode,
    };

    const { shippingService } = await import("@/modules/shipping/shipping.service");
    const result = await shippingService.scheduleReturnPickup({
      orderNumber: order.orderNumber,
      refundRequestNumber: doc.requestNumber,
      scheduledAt: input.scheduledAt,
      scheduledSlot: input.scheduledSlot,
      customer: addr,
      items: [
        {
          name: doc.productName,
          sku: doc.productName,
          units: doc.quantity,
          sellingPrice: doc.unitPrice,
        },
      ],
      weight: Math.max(0.5, doc.quantity * 0.25),
    });

    return mapRefund(
      await setAndTimeline(id, "quality_check", "pickup_scheduled", {
        actorId: adminId,
        actorRole: "admin",
        note: `Pickup scheduled via ${result.provider}`,
        extra: {
          pickup: {
            ...(typeof doc.pickup === "object" ? doc.pickup : {}),
            ...addr,
            scheduledAt: result.scheduledAt
              ? new Date(result.scheduledAt)
              : input.scheduledAt
                ? new Date(input.scheduledAt)
                : new Date(),
            scheduledSlot: input.scheduledSlot,
            courierName: result.courierName,
            pickupId: result.pickupId,
            awbCode: result.awbCode,
            trackingId: result.trackingId,
            provider: result.provider,
            raw: result.raw as Record<string, unknown> | undefined,
          },
        },
      })
    );
  }

  async completePickup(id: string, adminId: string, input: CompletePickupInput) {
    const doc = await refundRepository.findById(id);
    if (!doc) throw new NotFoundError("Refund request not found");

    return mapRefund(
      await setAndTimeline(id, doc.status, "pickup_completed", {
        actorId: adminId,
        actorRole: "admin",
        note: input.notes ?? "Pickup completed",
        extra: {
          pickup: {
            ...(typeof doc.pickup === "object" ? doc.pickup : {}),
            completedAt: new Date(),
          },
        },
      })
    );
  }

  async initiateRefund(id: string, adminId: string, input: InitiateRefundInput = {}) {
    let doc = await refundRepository.findById(id);
    if (!doc) throw new NotFoundError("Refund request not found");

    if (doc.status === "pickup_completed") {
      doc = (await setAndTimeline(id, "pickup_completed", "refund_processing", {
        actorId: adminId,
        actorRole: "admin",
        note: "Initiating refund",
      }))!;
    } else if (doc.status === "quality_check" && doc.skipPickup) {
      doc = (await setAndTimeline(id, "quality_check", "refund_processing", {
        actorId: adminId,
        actorRole: "admin",
        note: "Initiating refund (no pickup)",
      }))!;
    } else if (doc.status === "failed") {
      doc = (await setAndTimeline(id, "failed", "refund_processing", {
        actorId: adminId,
        actorRole: "admin",
        note: "Retrying refund",
      }))!;
    }

    if (doc.status !== "refund_processing") {
      throw new ValidationError(
        "Refund can only be initiated after pickup is completed (or skip-pickup path)"
      );
    }

    if (doc.razorpayRefundId) {
      return mapRefund(doc);
    }
    if (
      doc.refundInitiatedAt &&
      Date.now() - new Date(doc.refundInitiatedAt).getTime() < 60_000
    ) {
      throw new ConflictError("Refund initiation already in progress");
    }

    await RefundRequest.findByIdAndUpdate(id, {
      $set: { refundInitiatedAt: new Date() },
    });

    const amountInr = input.amountInr ?? doc.amount;
    if (amountInr > doc.amount + 0.01) {
      throw new ValidationError("Refund amount cannot exceed approved amount");
    }

    const order = await Order.findById(doc.orderId);
    if (!order) throw new NotFoundError("Order not found");

    try {
      if (order.paymentMethod === "cod") {
        await setAndTimeline(id, "refund_processing", "refunded", {
          actorId: adminId,
          actorRole: "admin",
          note: input.reason ?? "COD refund completed",
          extra: {
            refundedAt: new Date(),
            refundAmountPaise: Math.round(amountInr * 100),
          },
        });
        const sums = await refundRepository.sumRefundedAmountsForOrder(String(order._id));
        const refundedInr = sums[0]?.total ?? 0;
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: computeOrderRefundPaymentStatus(order.total, refundedInr),
        });
        return mapRefund(await refundRepository.findById(id));
      }

      const { paymentService } = await import("@/modules/payment/payment.service");
      const result = await paymentService.refundOrderPayment(String(order._id), {
        amountInr,
        reason: input.reason ?? doc.reason,
        requestNumber: doc.requestNumber,
      });

      if (result.pending && !result.alreadyRefunded) {
        await RefundRequest.findByIdAndUpdate(id, {
          $set: {
            razorpayRefundId: result.refundId,
            refundAmountPaise: result.amountPaise ?? Math.round(amountInr * 100),
          },
          $push: {
            timeline: {
              status: "refund_processing",
              note: "Refund submitted — awaiting payment gateway confirmation (5–7 business days)",
              actorId: new Types.ObjectId(adminId),
              actorRole: "admin",
              at: new Date(),
            },
          },
        });
        return mapRefund(await refundRepository.findById(id));
      }

      await setAndTimeline(id, "refund_processing", "refunded", {
        actorId: adminId,
        actorRole: "admin",
        note: result.alreadyRefunded
          ? "Payment was already refunded"
          : result.pending
            ? "Refund submitted — awaiting gateway confirmation"
            : `Razorpay refund ${result.refundId ?? "processed"}`,
        extra: {
          razorpayRefundId: result.refundId,
          refundAmountPaise: result.amountPaise ?? Math.round(amountInr * 100),
          refundedAt: result.pending ? undefined : new Date(),
          refundFailureReason: undefined,
        },
      });

      const sums = await refundRepository.sumRefundedAmountsForOrder(String(order._id));
      const refundedInr = sums[0]?.total ?? 0;
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: computeOrderRefundPaymentStatus(order.total, refundedInr),
      });
      return mapRefund(await refundRepository.findById(id));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Refund initiation failed";
      await setAndTimeline(id, "refund_processing", "failed", {
        actorId: adminId,
        actorRole: "admin",
        note: message,
        extra: {
          refundFailureReason: message,
          refundInitiatedAt: undefined,
        },
      });
      throw error;
    }
  }
}

export const refundService = new RefundService();
