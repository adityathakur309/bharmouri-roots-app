import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1).max(50),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});
