import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>("Media", mediaSchema);
