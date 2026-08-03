import mongoose, { Schema, type Document, type Model, Types } from "mongoose";
import type { PaymentMethod } from "@/types/order";

export type PaymentRecordStatus =
  | "initiated"
  | "processing"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  attemptNumber: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  idempotencyKey?: string;
  failureReason?: string;
  lockExpiresAt?: Date;
  paidAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: ["razorpay", "cod"], required: true },
    status: {
      type: String,
      enum: [
        "initiated",
        "processing",
        "awaiting_payment",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "initiated",
      index: true,
    },
    attemptNumber: { type: Number, default: 1, min: 1 },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, index: true, sparse: true, unique: true },
    razorpaySignature: String,
    idempotencyKey: { type: String, index: true, sparse: true },
    failureReason: String,
    lockExpiresAt: Date,
    paidAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1, attemptNumber: 1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", paymentSchema);
