import { productImage } from "@/lib/product-images";

export interface SeedVariant {
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  weight?: string;
  isActive?: boolean;
  attributes?: Record<string, string>;
  sortOrder?: number;
}

export interface SeedProduct {
  name: string;
  slug: string;
  sku?: string;
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
  metaTitle?: string;
  metaDescription?: string;
  isFeatured?: boolean;
  isNewProduct?: boolean;
  isBestseller?: boolean;
  codEnabled?: boolean;
  variants?: SeedVariant[];
}

function discountPct(price: number, mrp?: number) {
  if (!mrp || mrp <= price) return undefined;
  return Math.round(((mrp - price) / mrp) * 100);
}

function packVariants(
  baseSku: string,
  packs: Array<{ name: string; mrp: number; price: number; stock: number }>
): SeedVariant[] {
  return packs.map((p, index) => ({
    name: p.name,
    sku: `${baseSku}-${p.name.replace(/\s+/g, "").toUpperCase()}`,
    price: p.mrp,
    salePrice: p.price,
    stock: p.stock,
    weight: p.name,
    isActive: true,
    attributes: { size: p.name },
    sortOrder: index,
  }));
}

/**
 * Curated catalog from Himachali product brief (HP-001 … HP-010).
 * Mapped to existing Product schema — no schema changes.
 * Note: source `imageUrl` values were brand website URLs (not image files),
 * so we use stable product image seeds; replace via Admin upload anytime.
 */
export const SEED_PRODUCTS: SeedProduct[] = [
  // ——— Honey ———
  {
    name: "Himachali Multi Flora Raw Honey",
    slug: "himachali-multi-flora-raw-honey",
    sku: "BR-HP-001",
    category: "Honey",
    categorySlug: "honey",
    price: 550,
    originalPrice: 699,
    discount: discountPct(550, 699),
    stock: 48,
    images: [
      productImage("honey-multiflora-1"),
      productImage("honey-multiflora-2"),
      productImage("honey-multiflora-3"),
    ],
    description:
      "Pure raw multi-flora honey sourced from Himalayan flowers and mountain forests of Himachal Pradesh. Unheated and naturally rich.",
    shortDescription: "Natural Himachali multi-flora raw honey.",
    features: ["Raw & unheated", "Multi-flora", "Organic style", "Himachali origin"],
    weight: "500g",
    origin: "Himachal Pradesh, India",
    badge: "bestseller",
    metaTitle: "Buy Himachali Multi Flora Raw Honey | BharmouriRoots",
    metaDescription:
      "Shop pure Himachali multi-flora raw honey. Available in 250g, 500g and 1kg packs.",
    isFeatured: true,
    isBestseller: true,
    variants: packVariants("BR-HP-001", [
      { name: "250g", mrp: 320, price: 299, stock: 15 },
      { name: "500g", mrp: 699, price: 550, stock: 48 },
      { name: "1kg", mrp: 1299, price: 999, stock: 12 },
    ]),
  },
  {
    name: "Himachali Wild Forest Honey",
    slug: "himachali-wild-forest-honey",
    sku: "BR-HP-002",
    category: "Honey",
    categorySlug: "honey",
    price: 549,
    originalPrice: 699,
    discount: discountPct(549, 699),
    stock: 35,
    images: [
      productImage("honey-forest-1"),
      productImage("honey-forest-2"),
    ],
    description:
      "Raw forest honey collected from the Himalayan forests of Himachal Pradesh with a rich floral and earthy flavour.",
    shortDescription: "Raw Himalayan wild forest honey.",
    features: ["Forest collected", "Raw", "Earthy flavour", "Limited batch"],
    weight: "500g",
    origin: "Kullu Valley, Himachal Pradesh",
    isFeatured: true,
    isBestseller: true,
    variants: packVariants("BR-HP-002", [
      { name: "250g", mrp: 349, price: 299, stock: 12 },
      { name: "500g", mrp: 699, price: 549, stock: 35 },
      { name: "1kg", mrp: 1299, price: 999, stock: 8 },
    ]),
  },

  // ——— Pulses ———
  {
    name: "Chamba Himalayan Rajma",
    slug: "chamba-himalayan-rajma",
    sku: "BR-HP-003",
    category: "Pulses",
    categorySlug: "pulses",
    price: 399,
    originalPrice: 449,
    discount: discountPct(399, 449),
    stock: 72,
    images: [
      productImage("rajma-chamba-1"),
      productImage("rajma-chamba-2"),
    ],
    description:
      "Traditional Himalayan red kidney beans sourced from the mountain regions of Himachal Pradesh — creamy texture for authentic pahadi rajma.",
    shortDescription: "Authentic Himachali red rajma.",
    features: ["Chamba origin", "High altitude", "Stone cleaned", "Organic farming"],
    weight: "1kg",
    origin: "Chamba, Himachal Pradesh",
    badge: "bestseller",
    metaTitle: "Buy Chamba Himalayan Rajma Online | BharmouriRoots",
    isFeatured: true,
    isBestseller: true,
    variants: packVariants("BR-HP-003", [
      { name: "500g", mrp: 249, price: 219, stock: 30 },
      { name: "1kg", mrp: 449, price: 399, stock: 72 },
    ]),
  },
  {
    name: "Barot Valley White Rajmah",
    slug: "barot-valley-white-rajmah",
    sku: "BR-HP-004",
    category: "Pulses",
    categorySlug: "pulses",
    price: 369,
    originalPrice: 419,
    discount: discountPct(369, 419),
    stock: 55,
    images: [
      productImage("rajma-barot-1"),
      productImage("rajma-barot-2"),
    ],
    description:
      "Premium white rajmah cultivated in the high-altitude Barot Valley of Himachal Pradesh.",
    shortDescription: "Premium Barot Valley white rajmah.",
    features: ["Barot Valley", "White rajmah", "High altitude", "Organic"],
    weight: "1kg",
    origin: "Barot Valley, Himachal Pradesh",
    isFeatured: false,
    variants: packVariants("BR-HP-004", [
      { name: "500g", mrp: 229, price: 199, stock: 20 },
      { name: "1kg", mrp: 419, price: 369, stock: 55 },
    ]),
  },
  {
    name: "Himachali Kulath Dal",
    slug: "himachali-kulath-dal",
    sku: "BR-HP-005",
    category: "Pulses",
    categorySlug: "pulses",
    price: 299,
    originalPrice: 349,
    discount: discountPct(299, 349),
    stock: 62,
    images: [
      productImage("kulath-1"),
      productImage("kulath-2"),
    ],
    description:
      "Traditional Himalayan Kulath, also known as Gahat or Horse Gram, commonly used in Himachali cuisine for warming winter soups and dals.",
    shortDescription: "Traditional Himachali Kulath/Gahat dal.",
    features: ["Kulath / Gahat", "Horse gram", "Pahadi staple", "Organic"],
    weight: "900g",
    origin: "Himachal Pradesh, India",
    isFeatured: true,
    isNewProduct: true,
    variants: packVariants("BR-HP-005", [
      { name: "450g", mrp: 189, price: 169, stock: 25 },
      { name: "900g", mrp: 349, price: 299, stock: 62 },
    ]),
  },
  {
    name: "Himachali Kaale Mattar",
    slug: "himachali-kaale-mattar",
    sku: "BR-HP-009",
    category: "Pulses",
    categorySlug: "pulses",
    price: 199,
    originalPrice: 229,
    discount: discountPct(199, 229),
    stock: 46,
    images: [
      productImage("kaale-mattar-1"),
      productImage("kaale-mattar-2"),
    ],
    description:
      "Traditional Himalayan black peas cultivated in mountain farming regions and known for their earthy flavour.",
    shortDescription: "Traditional Himalayan black peas.",
    features: ["Kaale mattar", "Black peas", "Earthy flavour", "Organic"],
    weight: "500g",
    origin: "Himachal Pradesh, India",
    isFeatured: false,
    variants: packVariants("BR-HP-009", [
      { name: "250g", mrp: 129, price: 109, stock: 18 },
      { name: "500g", mrp: 229, price: 199, stock: 46 },
    ]),
  },

  // ——— Rice & Grains ———
  {
    name: "Himachali Pahadi Red Rice",
    slug: "himachali-pahadi-red-rice",
    sku: "BR-HP-006",
    category: "Rice & Grains",
    categorySlug: "rice-grains",
    price: 449,
    originalPrice: 499,
    discount: discountPct(449, 499),
    stock: 41,
    images: [
      productImage("red-rice-1"),
      productImage("red-rice-2"),
    ],
    description:
      "Traditional red rice grown in Himalayan farming communities of Himachal Pradesh — nutty aroma and wholesome nutrition.",
    shortDescription: "Authentic Pahadi Lal Chawal from Himachal.",
    features: ["Lal chawal", "Pahadi rice", "Mountain grown", "Organic"],
    weight: "1kg",
    origin: "Himachal Pradesh, India",
    isFeatured: true,
    variants: packVariants("BR-HP-006", [
      { name: "500g", mrp: 269, price: 239, stock: 16 },
      { name: "1kg", mrp: 499, price: 449, stock: 41 },
    ]),
  },

  // ——— Spices ———
  {
    name: "Himachali Yellow Chilli - Lakhori",
    slug: "himachali-yellow-chilli-lakhori",
    sku: "BR-HP-010",
    category: "Spices",
    categorySlug: "spices",
    price: 149,
    originalPrice: 179,
    discount: discountPct(149, 179),
    stock: 84,
    images: [
      productImage("lakhori-chilli-1"),
      productImage("lakhori-chilli-2"),
    ],
    description:
      "Traditional Himalayan yellow chilli with distinctive flavour and moderate heat, suitable for authentic Pahadi cooking.",
    shortDescription: "Traditional Himalayan Lakhori yellow chilli.",
    features: ["Lakhori chilli", "Moderate heat", "Pahadi spice", "Organic"],
    weight: "100g",
    origin: "Himalayan region, India",
    isFeatured: false,
    variants: packVariants("BR-HP-010", [
      { name: "50g", mrp: 99, price: 89, stock: 30 },
      { name: "100g", mrp: 179, price: 149, stock: 84 },
    ]),
  },

  // ——— Wellness ———
  {
    name: "Himalayan Shilajit Resin",
    slug: "himalayan-shilajit-resin",
    sku: "BR-HP-008",
    category: "Wellness",
    categorySlug: "wellness",
    price: 1649,
    originalPrice: 1999,
    discount: discountPct(1649, 1999),
    stock: 28,
    images: [
      productImage("shilajit-1"),
      productImage("shilajit-2"),
    ],
    description:
      "Himalayan shilajit resin sourced and processed for traditional wellness use. Use as directed; not a medicine.",
    shortDescription: "Premium Himalayan Shilajit resin.",
    features: ["Resin form", "Himalayan origin", "Traditional wellness", "Lab-checked batches"],
    weight: "40g",
    origin: "Himalayan region, India",
    isFeatured: true,
    isNewProduct: true,
    metaTitle: "Buy Himalayan Shilajit Resin | BharmouriRoots",
    variants: packVariants("BR-HP-008", [
      { name: "20g", mrp: 999, price: 899, stock: 12 },
      { name: "40g", mrp: 1999, price: 1649, stock: 28 },
    ]),
  },

  // ——— Handicrafts ———
  {
    name: "Traditional Himachali Pahari Topi",
    slug: "traditional-himachali-pahari-topi",
    sku: "BR-HP-007",
    category: "Handicrafts & Clothing",
    categorySlug: "handicrafts",
    price: 390,
    originalPrice: 499,
    discount: discountPct(390, 499),
    stock: 24,
    images: [
      productImage("pahari-topi-1"),
      productImage("pahari-topi-2"),
    ],
    description:
      "Traditional Himachali Pahari Topi inspired by the distinctive mountain culture and craftsmanship of Himachal Pradesh.",
    shortDescription: "Traditional Himachali woolen Pahari cap.",
    features: ["Handcrafted", "Woolen", "Cultural dress", "Pahari style"],
    origin: "Himachal Pradesh, India",
    isFeatured: true,
    metaTitle: "Buy Traditional Himachali Pahari Topi | BharmouriRoots",
    variants: [
      {
        name: "Standard",
        sku: "BR-HP-007-STD",
        price: 499,
        salePrice: 390,
        stock: 16,
        isActive: true,
        attributes: { size: "Free size" },
        sortOrder: 0,
      },
      {
        name: "Premium Embroidered",
        sku: "BR-HP-007-PREM",
        price: 699,
        salePrice: 549,
        stock: 8,
        isActive: true,
        attributes: { size: "Free size" },
        sortOrder: 1,
      },
    ],
  },
];

/** Previous catalog slugs to soft-deactivate (orders keep line snapshots). */
export const LEGACY_SEED_PRODUCT_SLUGS = [
  "organic-bharmouri-rajma",
  "kugti-valley-rajma",
  "organic-moong-dal",
  "black-maah-dal-urad",
  "bharmouri-dal-makhani-mix",
  "himalayan-multiflora-honey",
  "forest-raw-honey",
  "himalayan-walnuts",
  "himalayan-almonds",
  "chamba-shilajit-resin",
  "pahadi-guchchi-dried",
  "pahari-rock-salt",
  "chamba-chukh",
  "gaddi-topi",
  "kullu-topi",
  "organic-himachali-rajma",
  "black-maah-dal",
  "mountain-chana-dal",
  "himalayan-wild-honey",
  "multiflora-mountain-honey",
  "rhododendron-honey",
  "kullu-shawl",
  "kinnauri-pattern-shawl",
  "soft-merino-stole",
  "handloom-festival-shawl",
  "mixed-himalayan-dry-fruits",
  "dried-himalayan-apricots",
  "himachali-topi",
  "green-himachali-cap",
  "kids-himachali-topi",
  "himachali-red-apples",
  "golden-delicious-apples",
  "rich-red-apples",
  "mixed-himachali-apple-feast",
  "pattu-woolen-fabric",
  "pattu-wool-blanket",
  "pattu-shoulder-wrap",
  "handloom-pattu-runner",
  "pahadi-masala",
  "pahadi-red-chilli-powder",
  "timur-pepper-pods",
] as const;
