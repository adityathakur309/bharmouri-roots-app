export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  productCount: number;
  isActive?: boolean;
}
