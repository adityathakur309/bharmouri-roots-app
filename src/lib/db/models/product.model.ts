import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IProductVariant {
  _id?: Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  weight?: string;
  isActive: boolean;
  /** Extensible attributes (size, colour, pack, etc.) without schema migrations. */
  attributes: Record<string, string>;
  sortOrder: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku?: string;
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
  metaTitle?: string;
  metaDescription?: string;
  isFeatured: boolean;
  isNewProduct: boolean;
  isBestseller: boolean;
  isActive: boolean;
  /** Per-product COD. Only meaningful when global commerce.cod_enabled is true. */
  codEnabled: boolean;
  variants: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    weight: String,
    isActive: { type: Boolean, default: true },
    attributes: { type: Map, of: String, default: {} },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: { type: String, trim: true, sparse: true },
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
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    isFeatured: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    codEnabled: { type: Boolean, default: false },
    variants: { type: [productVariantSchema], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ "variants.sku": 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", productSchema);
