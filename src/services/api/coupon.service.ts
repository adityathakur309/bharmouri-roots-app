import { apiRequest } from "./client";

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountPercent: number;
  expiresAt?: string | null;
  isActive: boolean;
  maxUsesPerUser: number;
  maxTotalUses: number;
  usedCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export const couponApi = {
  list: (params?: Record<string, unknown>) =>
    apiRequest<Coupon[]>("get", "/admin/coupons", undefined, params),

  create: (data: Record<string, unknown>) =>
    apiRequest<Coupon>("post", "/admin/coupons", data),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<Coupon>("patch", `/admin/coupons/${id}`, data),

  remove: (id: string) => apiRequest<Coupon>("delete", `/admin/coupons/${id}`),

  usage: (id: string, params?: Record<string, unknown>) =>
    apiRequest<
      Array<{
        id: string;
        code: string;
        discountPercent: number;
        discountAmount: number;
        userId: string;
        userName?: string;
        userEmail?: string;
        orderId?: string;
        orderNumber?: string;
        createdAt?: string;
      }>
    >("get", `/admin/coupons/${id}/usage`, undefined, params),
};
