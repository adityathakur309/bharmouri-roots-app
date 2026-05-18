export interface Product {
  id: string;
  name: string;
  slug: string;
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
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
}
