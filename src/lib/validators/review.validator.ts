import { z } from "zod";
import { paginationSchema } from "@/lib/utils/query";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
  title: z.string().trim().max(120).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(10).max(2000).optional(),
  title: z.string().trim().max(120).optional(),
});

export const reviewListQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "oldest", "rating_high", "rating_low"]).optional(),
});

export const adminReviewQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected", "all"]).optional().default("pending"),
  search: z.string().max(100).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewListQueryInput = z.infer<typeof reviewListQuerySchema>;
export type AdminReviewQueryInput = z.infer<typeof adminReviewQuerySchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
