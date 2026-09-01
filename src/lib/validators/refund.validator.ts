import { z } from "zod";
import { paginationSchema } from "@/lib/utils/query";

export const refundStatuses = [
  "requested",
  "under_review",
  "approved",
  "rejected",
  "quality_check",
  "pickup_scheduled",
  "pickup_completed",
  "refund_processing",
  "refunded",
  "failed",
] as const;

export const createRefundRequestSchema = z.object({
  orderId: z.string().min(1),
  /** Index of order.items line */
  itemIndex: z.number().int().min(0),
  quantity: z.number().int().min(1),
  reason: z.string().trim().min(5).max(500),
  customerNotes: z.string().trim().max(1000).optional(),
  evidenceImages: z
    .array(
      z.union([
        z.string().url(),
        z.string().regex(/^\/(uploads|images|api\/media)\//),
      ])
    )
    .max(6)
    .optional(),
});

export const adminRefundQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([...refundStatuses, "all"] as const).optional().default("all"),
  search: z.string().max(80).optional(),
});

export const reviewRefundSchema = z.object({
  action: z.enum(["start_review", "approve", "reject"]),
  rejectionReason: z.string().trim().max(500).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
  skipPickup: z.boolean().optional(),
});

export const qualityCheckSchema = z.object({
  passed: z.boolean(),
  condition: z
    .enum(["unopened", "opened_unused", "damaged", "defective", "wrong_item", "other"])
    .optional(),
  notes: z.string().trim().max(1000).optional(),
  evidenceImages: z.array(z.string()).max(6).optional(),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const schedulePickupSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  scheduledSlot: z.string().max(80).optional(),
  addressLine: z.string().min(5).max(300).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  phone: z.string().min(8).max(15).optional(),
});

export const completePickupSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

export const initiateRefundSchema = z.object({
  /** Optional override — must be ≤ approved amount; validated server-side */
  amountInr: z.number().positive().optional(),
  reason: z.string().trim().max(200).optional(),
});

export type CreateRefundRequestInput = z.infer<typeof createRefundRequestSchema>;
export type AdminRefundQueryInput = z.infer<typeof adminRefundQuerySchema>;
export type ReviewRefundInput = z.infer<typeof reviewRefundSchema>;
export type QualityCheckInput = z.infer<typeof qualityCheckSchema>;
export type SchedulePickupInput = z.infer<typeof schedulePickupSchema>;
export type CompletePickupInput = z.infer<typeof completePickupSchema>;
export type InitiateRefundInput = z.infer<typeof initiateRefundSchema>;
