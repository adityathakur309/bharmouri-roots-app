import mongoose, { Schema, type Document, type Model, Types } from "mongoose";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  variantId?: Types.ObjectId;
  variantName?: string;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  activePaymentId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  invoiceNumber?: string;
  stockDecremented?: boolean;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  couponCode?: string;
  courierName?: string;
  awbCode?: string;
  trackingId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  /** Estimated delivery window from courier quote, e.g. "5-7" */
  estimatedDelivery?: string;
  /** Provider shipment status label, e.g. shipment_created */
  shipmentStatus?: string;
  /** Which booking provider wrote shipment fields (mock | shiprocket) */
  shippingProvider?: string;
  adminNotes?: string;
  paidAt?: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
    variantId: { type: Schema.Types.ObjectId },
    variantName: String,
  },
  { _id: false }
);

const addressSchema = new Schema<IOrderAddress>(
  {
    fullName: String,
    phone: String,
    email: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [orderItemSchema],
    shippingAddress: { type: addressSchema, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "payment_pending",
        "paid",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["razorpay", "cod"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, index: true, sparse: true },
    razorpaySignature: String,
    activePaymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    invoiceNumber: { type: String, index: true, sparse: true },
    stockDecremented: { type: Boolean, default: false },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: String,
    courierName: String,
    awbCode: String,
    trackingId: String,
    shiprocketOrderId: String,
    shiprocketShipmentId: String,
    estimatedDelivery: String,
    shipmentStatus: String,
    shippingProvider: String,
    adminNotes: String,
    paidAt: Date,
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", orderSchema);
