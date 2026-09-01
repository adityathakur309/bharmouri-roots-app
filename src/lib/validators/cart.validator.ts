import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  variantId: z.string().min(1).optional(),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0),
  variantId: z.string().min(1).optional().nullable(),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(2).max(40),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});
