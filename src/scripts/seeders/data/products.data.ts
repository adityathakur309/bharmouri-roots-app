import { productImage } from "@/lib/product-images";

export interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  images: string[];
  description: string;
  shortDescription: string;
  features: string[];
  weight?: string;
  origin: string;
  badge?: string;
  isFeatured?: boolean;
  isNewProduct?: boolean;
  isBestseller?: boolean;
}

/**
 * Default catalog seeded into MongoDB (idempotent by slug).
 * Kept small on purpose — admins can add more from the dashboard.
 */
export const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Organic Himachali Rajma",
    slug: "organic-himachali-rajma",
    category: "Organic Dals",
    categorySlug: "organic-dals",
    price: 299,
    originalPrice: 399,
    discount: 25,
    stock: 50,
    images: [productImage("rajma-1"), productImage("rajma-2")],
    description:
      "Hand-picked organic Rajma (kidney beans) from the pristine valleys of Bharmour, Himachal Pradesh. Grown at an altitude of 2,000+ meters without any pesticides or chemicals.",
    shortDescription: "Premium mountain-grown kidney beans from Bharmour's organic farms.",
    features: ["100% Organic", "No Pesticides", "High Protein", "Mountain grown at 2000m+"],
    weight: "500g",
    origin: "Bharmour, Himachal Pradesh",
    badge: "bestseller",
    isFeatured: true,
    isBestseller: true,
  },
  {
    name: "Himalayan Wild Honey",
    slug: "himalayan-wild-honey",
    category: "Pure Honey",
    categorySlug: "honey",
    price: 599,
    originalPrice: 799,
    discount: 25,
    stock: 25,
    images: [productImage("honey-1"), productImage("honey-2")],
    description:
      "Raw, unprocessed wild honey collected from the high-altitude meadows of Bharmour. Distinctive floral aroma from rhododendron and deodar blossoms.",
    shortDescription: "Raw, unfiltered honey from Himalayan wildflower meadows.",
    features: ["100% Raw", "Unprocessed", "Wildflower nectar", "No additives"],
    weight: "500g",
    origin: "Bharmour, Himachal Pradesh",
    badge: "premium",
    isFeatured: true,
    isBestseller: true,
  },
  {
    name: "Himachali Kullu Shawl",
    slug: "kullu-shawl",
    category: "Himachali Shawls",
    categorySlug: "shawls",
    price: 2499,
    originalPrice: 3500,
    discount: 29,
    stock: 15,
    images: [productImage("shawl-1"), productImage("shawl-2")],
    description:
      "Authentic Kullu Shawl handwoven by local Himachali artisans using traditional loom techniques. Made from premium Merino wool with intricate geometric patterns.",
    shortDescription: "Handwoven traditional shawl by Himachali artisans.",
    features: ["100% Merino wool", "Handwoven", "Traditional patterns", "Artisan crafted"],
    origin: "Kullu, Himachal Pradesh",
    badge: "handmade",
    isFeatured: true,
    isNewProduct: true,
  },
  {
    name: "Kashmiri Walnuts (Akhrot)",
    slug: "himalayan-walnuts",
    category: "Dry Fruits & Nuts",
    categorySlug: "dry-fruits",
    price: 699,
    originalPrice: 899,
    discount: 22,
    stock: 40,
    images: [productImage("walnuts-1"), productImage("walnuts-2")],
    description:
      "Premium paper-shell walnuts from Himalayan orchards. Hand-cracked and carefully selected for plump kernels rich in Omega-3.",
    shortDescription: "Premium paper-shell Himalayan walnuts, rich in Omega-3.",
    features: ["Paper-shell variety", "Hand-cracked", "Rich in Omega-3", "No preservatives"],
    weight: "500g",
    origin: "Kinnaur, Himachal Pradesh",
    isFeatured: true,
  },
  {
    name: "Himachali Red Apple Box",
    slug: "himachali-red-apples",
    category: "Fresh Apples",
    categorySlug: "apples",
    price: 999,
    originalPrice: 1299,
    discount: 23,
    stock: 30,
    images: [productImage("apples-1"), productImage("apples-2")],
    description:
      "Fresh Royal Delicious apples from high-altitude Himachal orchards. Naturally sweet with a perfect crunch, packed in an eco-friendly box.",
    shortDescription: "Fresh Royal Delicious apples from Himachali high-altitude orchards.",
    features: ["Farm-fresh", "High-altitude grown", "Naturally sweet", "Eco-friendly packaging"],
    weight: "5 kg Box",
    origin: "Shimla, Himachal Pradesh",
    badge: "seasonal",
    isFeatured: true,
    isBestseller: true,
  },
  {
    name: "Pahadi Garam Masala",
    slug: "pahadi-masala",
    category: "Pahadi Spices",
    categorySlug: "spices",
    price: 199,
    originalPrice: 249,
    discount: 20,
    stock: 60,
    images: [productImage("masala-1"), productImage("masala-2")],
    description:
      "Aromatic garam masala blend prepared from sun-dried mountain spices. Ground in small batches to preserve fragrance and flavor.",
    shortDescription: "Small-batch mountain garam masala from Pahadi spices.",
    features: ["Freshly ground", "No fillers", "Aromatic", "Traditional recipe"],
    weight: "100g",
    origin: "Chamba, Himachal Pradesh",
    isFeatured: true,
    isNewProduct: true,
  },
];

/** Older mock-catalog slugs that may exist from previous seeds — deactivated (not deleted). */
export const LEGACY_SEED_PRODUCT_SLUGS = [
  "organic-himachali-rajma",
  "black-maah-dal",
  "himalayan-wild-honey",
  "kullu-shawl",
  "himalayan-walnuts",
  "himachali-topi",
  "himachali-red-apples",
  "pattu-woolen-fabric",
  "mixed-himalayan-dry-fruits",
  "pahadi-masala",
  "chamba-chukh",
  "himalayan-almonds",
] as const;
