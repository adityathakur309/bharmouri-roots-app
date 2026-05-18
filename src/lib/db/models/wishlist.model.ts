import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  updatedAt: Date;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>("Wishlist", wishlistSchema);
