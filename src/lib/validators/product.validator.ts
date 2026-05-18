import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  categorySlug: z.string().min(1),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  images: z
    .array(
      z.union([
        z.string().url(),
        z
          .string()
          .regex(/^\/(uploads|images)\//)
          .or(z.string().regex(/^\/api\/media\/[a-f0-9]{24}$/i)),
      ])
    )
    .min(1),
  description: z.string().min(10),
  shortDescription: z.string().min(5).max(500),
  features: z.array(z.string()).default([]),
  weight: z.string().optional(),
  origin: z.string().min(1),
  badge: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isNewProduct: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "rating"]).optional(),
});

export const productIdSchema = z.object({
  id: z.string().min(1),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
