import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { UserRole } from "@/types/auth";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  googleId?: string;
  emailVerified?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: String,
    phone: String,
    googleId: { type: String, sparse: true },
    emailVerified: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
