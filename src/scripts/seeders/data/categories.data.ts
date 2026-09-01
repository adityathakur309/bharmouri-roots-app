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
 * Categories aligned to the curated Himachali catalog (by product group).
 */
export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "Honey",
    slug: "honey",
    icon: "🍯",
    description: "Raw multiflora and forest honey from Himalayan apiaries",
    image: categoryImage("honey"),
    sortOrder: 1,
    subcategories: [
      { name: "Multiflora Honey", slug: "multiflora-honey", description: "Wild multiflora honey" },
      { name: "Forest Honey", slug: "forest-honey", description: "Forest-collected raw honey" },
    ],
  },
  {
    name: "Pulses",
    slug: "pulses",
    icon: "🫘",
    description: "Himachali rajma, kulath, and mountain pulses",
    image: categoryImage("pulses"),
    sortOrder: 2,
    subcategories: [
      { name: "Rajma", slug: "rajma", description: "Chamba & valley rajma" },
      { name: "Kulath / Gahat", slug: "kulath", description: "Horse gram dal" },
      { name: "Kaale Mattar", slug: "kaale-mattar", description: "Himalayan black peas" },
    ],
  },
  {
    name: "Rice & Grains",
    slug: "rice-grains",
    icon: "🌾",
    description: "Traditional pahadi rice and mountain grains",
    image: categoryImage("rice-grains"),
    sortOrder: 3,
    subcategories: [
      { name: "Red Rice", slug: "red-rice", description: "Pahadi lal chawal" },
    ],
  },
  {
    name: "Spices",
    slug: "spices",
    icon: "🌶️",
    description: "Authentic Himalayan chillies and pahadi spices",
    image: categoryImage("spices"),
    sortOrder: 4,
    subcategories: [
      { name: "Chillies", slug: "chillies", description: "Lakhori and mountain chillies" },
    ],
  },
  {
    name: "Wellness",
    slug: "wellness",
    icon: "🪨",
    description: "Himalayan shilajit and traditional wellness resins",
    image: categoryImage("wellness"),
    sortOrder: 5,
    subcategories: [
      { name: "Shilajit", slug: "shilajit", description: "Purified resin" },
    ],
  },
  {
    name: "Handicrafts & Clothing",
    slug: "handicrafts",
    icon: "🧢",
    description: "Pahari topi and traditional Himachali craft",
    image: categoryImage("handicrafts"),
    sortOrder: 6,
    subcategories: [
      { name: "Pahari Topi", slug: "pahari-topi", description: "Traditional woolen caps" },
    ],
  },
];

/** Known older taxonomy slugs (seed also soft-deactivates any slug not in SEED_CATEGORIES). */
export const LEGACY_SEED_CATEGORY_SLUGS = [
  "organic-dals",
  "nuts",
  "chamba-shilajit",
  "pahadi-guchchi",
  "dal-makhani",
  "pahari-salt",
  "traditional-pahari",
  "topi",
  "dry-fruits",
  "apples",
  "shawls",
  "pattu",
] as const;
