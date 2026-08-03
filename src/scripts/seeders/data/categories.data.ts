import { categoryImage } from "@/lib/product-images";

export interface SeedSubcategory {
  name: string;
  slug: string;
  description: string;
}

export interface SeedCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
  sortOrder: number;
  subcategories: SeedSubcategory[];
}

/**
 * Default taxonomy for BharmouriRoots — Himachali organic foods & crafts.
 * Slugs align with existing product.categorySlug / shop filters.
 */
export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "Organic Dals",
    slug: "organic-dals",
    icon: "🌾",
    description: "Hand-picked mountain lentils from Bharmour valleys",
    image: categoryImage("organic-dals"),
    sortOrder: 1,
    subcategories: [
      { name: "Rajma", slug: "rajma", description: "Kidney beans grown at high altitude" },
      { name: "Moong Dal", slug: "moong-dal", description: "Split green gram dals" },
      { name: "Masoor Dal", slug: "masoor-dal", description: "Red lentils from mountain farms" },
      { name: "Chana Dal", slug: "chana-dal", description: "Split chickpea dals" },
    ],
  },
  {
    name: "Dry Fruits & Nuts",
    slug: "dry-fruits",
    icon: "🥜",
    description: "Himalayan dry fruits and nuts",
    image: categoryImage("dry-fruits"),
    sortOrder: 2,
    subcategories: [
      { name: "Almonds", slug: "almonds", description: "Mountain almonds" },
      { name: "Walnuts", slug: "walnuts", description: "Himachali walnuts" },
      { name: "Apricots", slug: "apricots", description: "Dried Himalayan apricots" },
      { name: "Raisins", slug: "raisins", description: "Sun-dried raisins" },
    ],
  },
  {
    name: "Fresh Apples",
    slug: "apples",
    icon: "🍎",
    description: "Crisp Himachali apples",
    image: categoryImage("apples"),
    sortOrder: 3,
    subcategories: [
      { name: "Royal Delicious", slug: "royal-delicious", description: "Classic Himachali red apples" },
      { name: "Rich Red", slug: "rich-red", description: "Deep-red mountain apples" },
      { name: "Golden Delicious", slug: "golden-delicious", description: "Sweet golden variety" },
    ],
  },
  {
    name: "Pure Honey",
    slug: "honey",
    icon: "🍯",
    description: "Raw mountain honey",
    image: categoryImage("honey"),
    sortOrder: 4,
    subcategories: [
      { name: "Multiflora Honey", slug: "multiflora-honey", description: "Wild multiflora nectar" },
      { name: "Wildflower Honey", slug: "wildflower-honey", description: "Seasonal wildflower honey" },
      { name: "Forest Honey", slug: "forest-honey", description: "Forest-collected raw honey" },
    ],
  },
  {
    name: "Himachali Shawls",
    slug: "shawls",
    icon: "🧣",
    description: "Traditional woolen shawls",
    image: categoryImage("shawls"),
    sortOrder: 5,
    subcategories: [
      { name: "Kullu Shawls", slug: "kullu-shawls", description: "Patterned Kullu weave shawls" },
      { name: "Kinnauri Shawls", slug: "kinnauri-shawls", description: "Traditional Kinnauri designs" },
      { name: "Pashmina Blend", slug: "pashmina-blend", description: "Soft wool–pashmina blends" },
    ],
  },
  {
    name: "Himachali Topi",
    slug: "topi",
    icon: "🧢",
    description: "Traditional Himachali caps",
    image: categoryImage("topi"),
    sortOrder: 6,
    subcategories: [
      { name: "Bushahri Topi", slug: "bushahri-topi", description: "Classic Bushahri style caps" },
      { name: "Kinnauri Topi", slug: "kinnauri-topi", description: "Embroidered Kinnauri caps" },
      { name: "Kullu Topi", slug: "kullu-topi", description: "Colorful Kullu caps" },
    ],
  },
  {
    name: "Pattu",
    slug: "pattu",
    icon: "🧵",
    description: "Handwoven woolen fabric",
    image: categoryImage("pattu"),
    sortOrder: 7,
    subcategories: [
      { name: "Handwoven Pattu", slug: "handwoven-pattu", description: "Traditional handloom pattu" },
      { name: "Patterned Pattu", slug: "patterned-pattu", description: "Decorative woven patterns" },
      { name: "Plain Pattu", slug: "plain-pattu", description: "Simple everyday wool fabric" },
    ],
  },
  {
    name: "Pahadi Spices",
    slug: "spices",
    icon: "🌶️",
    description: "Aromatic mountain spices",
    image: categoryImage("spices"),
    sortOrder: 8,
    subcategories: [
      { name: "Red Chilli", slug: "red-chilli", description: "Sun-dried mountain chillies" },
      { name: "Garam Masala", slug: "garam-masala", description: "Local spice blends" },
      { name: "Turmeric", slug: "turmeric", description: "Hill-grown turmeric" },
      { name: "Coriander", slug: "coriander", description: "Whole/ground coriander" },
    ],
  },
];
