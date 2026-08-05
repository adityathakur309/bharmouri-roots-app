import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  stock: number;
  images: string[];
  description: string;
  shortDescription: string;
  features: string[];
  weight?: string;
  origin: string;
  badge?: string;
  isFeatured: boolean;
  isNewProduct: boolean;
  isBestseller: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, required: true },
    categorySlug: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    features: [{ type: String }],
    weight: String,
    origin: { type: String, required: true },
    badge: String,
    isFeatured: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ isFeatured: 1, isActive: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", productSchema);
