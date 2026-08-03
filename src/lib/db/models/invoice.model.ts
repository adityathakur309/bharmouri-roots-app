import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IInvoiceItem {
  name: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  orderId: Types.ObjectId;
  paymentId: Types.ObjectId;
  userId: Types.ObjectId;
  orderNumber: string;
  amount: number;
  currency: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  items: IInvoiceItem[];
  billingAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: "issued" | "void";
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    items: [invoiceItemSchema],
    billingAddress: {
      fullName: String,
      phone: String,
      email: String,
      addressLine: String,
      city: String,
      state: String,
      pincode: String,
    },
    status: { type: String, enum: ["issued", "void"], default: "issued" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", invoiceSchema);
