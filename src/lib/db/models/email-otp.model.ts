import mongoose, { Schema, type Document, type Model } from "mongoose";

export type EmailOtpPurpose = "registration" | "login_mfa";

export interface IEmailOtp extends Document {
  email: string;
  purpose: EmailOtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailOtpSchema = new Schema<IEmailOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["registration", "login_mfa"], required: true },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    userId: { type: String },
  },
  { timestamps: true }
);

emailOtpSchema.index({ email: 1, purpose: 1 });
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailOtp: Model<IEmailOtp> =
  mongoose.models.EmailOtp ?? mongoose.model<IEmailOtp>("EmailOtp", emailOtpSchema);
