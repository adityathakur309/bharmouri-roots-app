import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountPercent: number;
  expiresAt?: Date | null;
  isActive: boolean;
  /** Default business rule: 1 use per user. */
  maxUsesPerUser: number;
  /** Default business rule: 5 total redemptions. */
  maxTotalUses: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponRedemption extends Document {
  couponId: Types.ObjectId;
  code: string;
  userId: Types.ObjectId;
  orderId?: Types.ObjectId;
  discountPercent: number;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 40,
    },
    description: { type: String, trim: true, maxlength: 300 },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    maxUsesPerUser: { type: Number, required: true, min: 1, default: 1 },
    maxTotalUses: { type: Number, required: true, min: 1, default: 5 },
    usedCount: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

couponSchema.index({ isActive: 1, expiresAt: 1 });

const couponRedemptionSchema = new Schema<ICouponRedemption>(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    code: { type: String, required: true, uppercase: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    discountPercent: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

couponRedemptionSchema.index({ couponId: 1, userId: 1 });
couponRedemptionSchema.index({ orderId: 1 }, { sparse: true });

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon ?? mongoose.model<ICoupon>("Coupon", couponSchema);

export const CouponRedemption: Model<ICouponRedemption> =
  mongoose.models.CouponRedemption ??
  mongoose.model<ICouponRedemption>("CouponRedemption", couponRedemptionSchema);
