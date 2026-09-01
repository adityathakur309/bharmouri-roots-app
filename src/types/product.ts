export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  weight?: string;
  isActive: boolean;
  attributes: Record<string, string>;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  stock: number;
  images: string[];
  description: string;
  shortDescription: string;
  features: string[];
  weight?: string;
  origin: string;
  badge?: string;
  metaTitle?: string;
  metaDescription?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  /** Cash on Delivery for this product (requires global COD setting). */
  codEnabled?: boolean;
  variants?: ProductVariant[];
}
