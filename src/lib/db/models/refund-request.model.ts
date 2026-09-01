import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export type RefundRequestStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "quality_check"
  | "pickup_scheduled"
  | "pickup_completed"
  | "refund_processing"
  | "refunded"
  | "failed";

export type ProductCondition =
  | "unopened"
  | "opened_unused"
  | "damaged"
  | "defective"
  | "wrong_item"
  | "other";

export interface IRefundTimelineEvent {
  status: RefundRequestStatus;
  note?: string;
  actorId?: Types.ObjectId;
  actorRole?: "user" | "admin" | "system";
  at: Date;
}

export interface IRefundPickupInfo {
  scheduledAt?: Date;
  scheduledSlot?: string;
  courierName?: string;
  pickupId?: string;
  awbCode?: string;
  trackingId?: string;
  provider?: "mock" | "shiprocket";
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  completedAt?: Date;
  raw?: Record<string, unknown>;
}

export interface IRefundQualityCheck {
  condition?: ProductCondition;
  passed?: boolean;
  notes?: string;
  evidenceImages?: string[];
  checkedAt?: Date;
  checkedBy?: Types.ObjectId;
}

export interface IRefundRequest extends Document {
  requestNumber: string;
  orderId: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  /** Snapshot of the order line being returned */
  productId?: Types.ObjectId;
  productName: string;
  productImage?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  /** Server-calculated refund amount (INR) */
  amount: number;
  reason: string;
  customerNotes?: string;
  status: RefundRequestStatus;
  rejectionReason?: string;
  adminNotes?: string;
  qualityCheck: IRefundQualityCheck;
  pickup: IRefundPickupInfo;
  /** Skip physical return (e.g. never delivered / lost in transit) */
  skipPickup: boolean;
  razorpayRefundId?: string;
  razorpayPaymentId?: string;
  refundAmountPaise?: number;
  refundFailureReason?: string;
  refundedAt?: Date;
  timeline: IRefundTimelineEvent[];
  /** Idempotency / duplicate protection for Razorpay call */
  refundInitiatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const timelineSchema = new Schema<IRefundTimelineEvent>(
  {
    status: { type: String, required: true },
    note: String,
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, enum: ["user", "admin", "system"] },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const qualitySchema = new Schema<IRefundQualityCheck>(
  {
    condition: {
      type: String,
      enum: ["unopened", "opened_unused", "damaged", "defective", "wrong_item", "other"],
    },
    passed: Boolean,
    notes: String,
    evidenceImages: [{ type: String }],
    checkedAt: Date,
    checkedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const pickupSchema = new Schema<IRefundPickupInfo>(
  {
    scheduledAt: Date,
    scheduledSlot: String,
    courierName: String,
    pickupId: String,
    awbCode: String,
    trackingId: String,
    provider: { type: String, enum: ["mock", "shiprocket"] },
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    completedAt: Date,
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    requestNumber: { type: String, required: true, unique: true, index: true },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    productImage: String,
    variantName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    customerNotes: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: [
        "requested",
        "under_review",
        "approved",
        "rejected",
        "quality_check",
        "pickup_scheduled",
        "pickup_completed",
        "refund_processing",
        "refunded",
        "failed",
      ],
      default: "requested",
      index: true,
    },
    rejectionReason: String,
    adminNotes: String,
    qualityCheck: { type: qualitySchema, default: () => ({}) },
    pickup: { type: pickupSchema, default: () => ({}) },
    skipPickup: { type: Boolean, default: false },
    razorpayRefundId: { type: String, index: true, sparse: true },
    razorpayPaymentId: String,
    refundAmountPaise: Number,
    refundFailureReason: String,
    refundedAt: Date,
    timeline: { type: [timelineSchema], default: [] },
    refundInitiatedAt: Date,
  },
  { timestamps: true }
);

refundRequestSchema.index({ status: 1, createdAt: -1 });
refundRequestSchema.index({ userId: 1, createdAt: -1 });
refundRequestSchema.index({ orderId: 1, status: 1 });

export const RefundRequest: Model<IRefundRequest> =
  mongoose.models.RefundRequest ??
  mongoose.model<IRefundRequest>("RefundRequest", refundRequestSchema);
