import mongoose, { Schema, type Document, type Model } from "mongoose";

/**
 * Key/value application settings. Unique by `key` for idempotent upserts.
 */
export interface ISetting extends Document {
  key: string;
  value: unknown;
  group: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    group: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Setting: Model<ISetting> =
  mongoose.models.Setting ?? mongoose.model<ISetting>("Setting", settingSchema);
