import { apiRequest } from "./client";

export interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  title?: string;
  verified: boolean;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export const reviewApi = {
  list: (productIdOrSlug: string, params?: { page?: number; limit?: number; sort?: string }) =>
    apiRequest<ReviewItem[]>("get", `/products/${productIdOrSlug}/reviews`, undefined, params as Record<string, unknown>),

  mine: (productIdOrSlug: string) =>
    apiRequest<ReviewItem | null>("get", `/products/${productIdOrSlug}/reviews/mine`),

  create: (
    productIdOrSlug: string,
    data: { rating: number; comment: string; title?: string }
  ) => apiRequest<ReviewItem>("post", `/products/${productIdOrSlug}/reviews`, data),

  update: (
    reviewId: string,
    data: { rating?: number; comment?: string; title?: string }
  ) => apiRequest<ReviewItem>("patch", `/reviews/${reviewId}`, data),

  remove: (reviewId: string) =>
    apiRequest<{ deleted: boolean; summary: ReviewSummary }>("delete", `/reviews/${reviewId}`),
};
