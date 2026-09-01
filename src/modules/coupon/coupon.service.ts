import { Types } from "mongoose";
import { Coupon, CouponRedemption, type ICoupon } from "@/lib/db/models";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";
import { buildPaginationMeta, getSkip } from "@/lib/utils/query";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type {
  CouponInput,
  CouponQueryInput,
} from "@/lib/validators/coupon.validator";

function mapCoupon(doc: unknown) {
  const d = doc as Record<string, unknown>;
  return {
    id: String(d._id),
    code: String(d.code),
    description: d.description ? String(d.description) : undefined,
    discountPercent: Number(d.discountPercent),
    expiresAt: d.expiresAt ?? null,
    isActive: Boolean(d.isActive),
    maxUsesPerUser: Number(d.maxUsesPerUser ?? 1),
    maxTotalUses: Number(d.maxTotalUses ?? 5),
    usedCount: Number(d.usedCount ?? 0),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export class CouponService {
  async list(query: CouponQueryInput) {
    const filter: Record<string, unknown> = {};
    if (query.active !== undefined) filter.isActive = query.active;
    if (query.search) {
      filter.code = { $regex: query.search.trim(), $options: "i" };
    }

    const skip = getSkip(query.page, query.limit);
    const [rows, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    return {
      coupons: rows.map((r) => mapCoupon(r)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string) {
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw new NotFoundError("Coupon not found");
    return mapCoupon(coupon);
  }

  async create(input: CouponInput) {
    const data = sanitizeObject({ ...input });
    const code = data.code.toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing) throw new ConflictError("Coupon code already exists");

    const coupon = await Coupon.create({
      code,
      description: data.description,
      discountPercent: data.discountPercent,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive ?? true,
      maxUsesPerUser: data.maxUsesPerUser ?? 1,
      maxTotalUses: data.maxTotalUses ?? 5,
      usedCount: 0,
    });
    return mapCoupon(coupon.toObject());
  }

  async update(id: string, input: Partial<CouponInput>) {
    const data = sanitizeObject({ ...input });
    if (data.code) {
      data.code = data.code.toUpperCase();
      const clash = await Coupon.findOne({
        code: data.code,
        _id: { $ne: id },
      });
      if (clash) throw new ConflictError("Coupon code already exists");
    }

    const update: Record<string, unknown> = { ...data };
    if (data.expiresAt !== undefined) {
      update.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!coupon) throw new NotFoundError("Coupon not found");
    return mapCoupon(coupon);
  }

  async remove(id: string) {
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).lean();
    if (!coupon) throw new NotFoundError("Coupon not found");
    return mapCoupon(coupon);
  }

  async listUsage(couponId: string, page = 1, limit = 20) {
    const coupon = await Coupon.findById(couponId).lean();
    if (!coupon) throw new NotFoundError("Coupon not found");

    const skip = getSkip(page, limit);
    const [rows, total] = await Promise.all([
      CouponRedemption.find({ couponId: new Types.ObjectId(couponId) })
        .populate("userId", "name email")
        .populate("orderId", "orderNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CouponRedemption.countDocuments({ couponId: new Types.ObjectId(couponId) }),
    ]);

    return {
      usages: rows.map((r) => {
        const user = r.userId as unknown as { _id?: Types.ObjectId; name?: string; email?: string };
        const order = r.orderId as unknown as { _id?: Types.ObjectId; orderNumber?: string };
        return {
          id: String(r._id),
          code: r.code,
          discountPercent: r.discountPercent,
          discountAmount: r.discountAmount,
          userId: user?._id ? String(user._id) : String(r.userId),
          userName: user?.name,
          userEmail: user?.email,
          orderId: order?._id ? String(order._id) : r.orderId ? String(r.orderId) : undefined,
          orderNumber: order?.orderNumber,
          createdAt: r.createdAt,
        };
      }),
      meta: buildPaginationMeta(page, limit, total),
      coupon: mapCoupon(coupon),
    };
  }

  /**
   * Server-side validation for applying a coupon to a cart.
   * Checks active, expiry, per-user and global usage limits.
   */
  async validateForUser(code: string, userId: string): Promise<ICoupon> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new ValidationError("Coupon code is required");

    const coupon = await Coupon.findOne({ code: normalized });
    if (!coupon || !coupon.isActive) {
      throw new ValidationError("Invalid or inactive coupon code");
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("This coupon has expired");
    }

    if (coupon.usedCount >= coupon.maxTotalUses) {
      throw new ValidationError("This coupon has reached its usage limit");
    }

    const userUses = await CouponRedemption.countDocuments({
      couponId: coupon._id,
      userId: new Types.ObjectId(userId),
    });
    if (userUses >= coupon.maxUsesPerUser) {
      throw new ValidationError("You have already used this coupon");
    }

    return coupon;
  }

  async recordRedemption(params: {
    coupon: ICoupon;
    userId: string;
    orderId: string;
    discountAmount: number;
  }) {
    await CouponRedemption.create({
      couponId: params.coupon._id,
      code: params.coupon.code,
      userId: new Types.ObjectId(params.userId),
      orderId: new Types.ObjectId(params.orderId),
      discountPercent: params.coupon.discountPercent,
      discountAmount: params.discountAmount,
    });
    await Coupon.findByIdAndUpdate(params.coupon._id, { $inc: { usedCount: 1 } });
  }

  async restoreRedemptionForOrder(orderId: string) {
    const redemption = await CouponRedemption.findOneAndDelete({
      orderId: new Types.ObjectId(orderId),
    });
    if (!redemption) return;
    await Coupon.findByIdAndUpdate(redemption.couponId, {
      $inc: { usedCount: -1 },
    });
  }
}

export const couponService = new CouponService();
