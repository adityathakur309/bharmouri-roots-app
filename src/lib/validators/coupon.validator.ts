import { z } from "zod";
import { paginationSchema } from "@/lib/utils/query";

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, _ and -"),
  description: z.string().trim().max(300).optional(),
  discountPercent: z.number().min(1).max(100),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
  isActive: z.boolean().optional().default(true),
  maxUsesPerUser: z.number().int().min(1).max(100).optional().default(1),
  maxTotalUses: z.number().int().min(1).max(100000).optional().default(5),
});

export const couponQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(40).optional(),
  active: z.coerce.boolean().optional(),
});

export const couponIdSchema = z.object({
  id: z.string().min(1),
});

export type CouponInput = z.infer<typeof couponSchema>;
export type CouponQueryInput = z.infer<typeof couponQuerySchema>;
