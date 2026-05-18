import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IAddress extends Document {
  userId: Types.ObjectId;
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  label?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    label: { type: String, default: "Home" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address: Model<IAddress> =
  mongoose.models.Address ?? mongoose.model<IAddress>("Address", addressSchema);
