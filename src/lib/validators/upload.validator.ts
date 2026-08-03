import { z } from "zod";

export const uploadPurposeSchema = z
  .enum(["product", "category", "banner", "profile", "general"])
  .default("general");

export type UploadPurposeInput = z.infer<typeof uploadPurposeSchema>;
