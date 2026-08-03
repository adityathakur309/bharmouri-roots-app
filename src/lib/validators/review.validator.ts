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

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewListQueryInput = z.infer<typeof reviewListQuerySchema>;
