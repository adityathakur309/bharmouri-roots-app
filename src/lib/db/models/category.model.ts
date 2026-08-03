import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * Product taxonomy for BharmouriRoots (Himachali organic / craft ecommerce).
 * Top-level categories have parent = null; subcategories reference their parent.
 * Products continue to store categorySlug as a string (existing behavior).
 */
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parent: Types.ObjectId | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    icon: String,
    image: String,
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, sortOrder: 1 });

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", categorySchema);
