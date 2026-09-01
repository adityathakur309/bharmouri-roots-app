import { Types } from "mongoose";
import {
  RefundRequest,
  type IRefundRequest,
  type RefundRequestStatus,
} from "@/lib/db/models/refund-request.model";
import { buildPaginationMeta, getSkip } from "@/lib/utils/query";
import type { AdminRefundQueryInput } from "@/lib/validators/refund.validator";

export class RefundRepository {
  create(data: Partial<IRefundRequest>) {
    return RefundRequest.create(data);
  }

  findById(id: string) {
    return RefundRequest.findById(id)
      .populate("userId", "name email phone avatar")
      .lean();
  }

  findByRequestNumber(requestNumber: string) {
    return RefundRequest.findOne({ requestNumber }).lean();
  }

  findActiveForOrderItem(orderId: string, productName: string, variantName?: string) {
    const filter: Record<string, unknown> = {
      orderId: new Types.ObjectId(orderId),
      productName,
      status: {
        $nin: ["rejected", "refunded", "failed"],
      },
    };
    if (variantName) filter.variantName = variantName;
    return RefundRequest.findOne(filter);
  }

  sumActiveAmountsForOrder(orderId: string) {
    return RefundRequest.aggregate<{ total: number }>([
      {
        $match: {
          orderId: new Types.ObjectId(orderId),
          status: { $nin: ["rejected", "failed"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
  }

  sumRefundedAmountsForOrder(orderId: string) {
    return RefundRequest.aggregate<{ total: number }>([
      {
        $match: {
          orderId: new Types.ObjectId(orderId),
          status: "refunded",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
  }

  findByUser(userId: string, page = 1, limit = 20) {
    const skip = getSkip(page, limit);
    const filter = { userId: new Types.ObjectId(userId) };
    return Promise.all([
      RefundRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RefundRequest.countDocuments(filter),
    ]);
  }

  findAdmin(query: AdminRefundQueryInput) {
    const filter: Record<string, unknown> = {};
    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { requestNumber: { $regex: q, $options: "i" } },
        { orderNumber: { $regex: q, $options: "i" } },
        { productName: { $regex: q, $options: "i" } },
        { reason: { $regex: q, $options: "i" } },
      ];
    }
    const skip = getSkip(query.page, query.limit);
    return Promise.all([
      RefundRequest.find(filter)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      RefundRequest.countDocuments(filter),
    ]);
  }

  update(id: string, data: Partial<IRefundRequest>) {
    return RefundRequest.findByIdAndUpdate(id, data, { new: true })
      .populate("userId", "name email phone avatar")
      .lean();
  }

  async appendTimeline(
    id: string,
    event: {
      status: RefundRequestStatus;
      note?: string;
      actorId?: string;
      actorRole?: "user" | "admin" | "system";
    }
  ) {
    return RefundRequest.findByIdAndUpdate(
      id,
      {
        $push: {
          timeline: {
            status: event.status,
            note: event.note,
            actorId: event.actorId
              ? new Types.ObjectId(event.actorId)
              : undefined,
            actorRole: event.actorRole,
            at: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("userId", "name email phone avatar")
      .lean();
  }
}

export const refundRepository = new RefundRepository();

export function buildRefundMeta(page: number, limit: number, total: number) {
  return buildPaginationMeta(page, limit, total);
}
