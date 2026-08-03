import mongoose, { Schema, type Document, type Model } from "mongoose";

export type MediaPurpose =
  | "product"
  | "category"
  | "banner"
  | "profile"
  | "general";

/**
 * Media metadata only — binary files live on disk under public/uploads.
 * Legacy docs may still have `data` (Buffer); new uploads never set it.
 */
export interface IMedia extends Document {
  filename: string;
  mimeType: string;
  size: number;
  /** Relative path from public/, e.g. uploads/product/uuid.webp */
  path?: string;
  /** Public URL path, e.g. /uploads/product/uuid.webp */
  url?: string;
  /** @deprecated Legacy MongoDB binary storage — prefer path/url */
  data?: Buffer;
  purpose: MediaPurpose;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, trim: true, index: true },
    url: { type: String, trim: true },
    data: { type: Buffer, select: false },
    purpose: {
      type: String,
      enum: ["product", "category", "banner", "profile", "general"],
      default: "general",
    },
  },
  { timestamps: true }
);

mediaSchema.index({ purpose: 1, createdAt: -1 });

export const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>("Media", mediaSchema);
