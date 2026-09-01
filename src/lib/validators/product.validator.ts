import { z } from "zod";
import { paginationSchema } from "@/lib/utils/query";

const imageUrlSchema = z.union([
  z.string().url(),
  z
    .string()
    .regex(/^\/(uploads|images)\//)
    .or(z.string().regex(/^\/api\/media\/[a-f0-9]{24}$/i)),
]);

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  sku: z.string().min(1).max(60),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  weight: z.string().max(40).optional(),
  isActive: z.boolean().optional().default(true),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  sku: z.string().min(1).max(60).optional(),
  category: z.string().min(1),
  categorySlug: z.string().min(1),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  images: z.array(imageUrlSchema).min(1),
  description: z.string().min(10),
  shortDescription: z.string().min(5).max(500),
  features: z.array(z.string()).default([]),
  weight: z.string().optional(),
  origin: z.string().min(1),
  badge: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isNewProduct: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isActive: z.boolean().optional(),
  codEnabled: z.boolean().optional(),
  variants: z.array(productVariantSchema).optional().default([]),
});

export const productSortSchema = z
  .enum(["price_asc", "price_desc", "newest", "rating"])
  .optional();

export const productQuerySchema = paginationSchema
  .extend({
    limit: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    sort: productSortSchema,
    featured: z.coerce.boolean().optional(),
  });

export const productIdSchema = z.object({
  id: z.string().min(1),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
