import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount: number;
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    couponCode: String,
    couponDiscount: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Cart: Model<ICart> =
  mongoose.models.Cart ?? mongoose.model<ICart>("Cart", cartSchema);
