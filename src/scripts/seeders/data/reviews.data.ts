export interface SeedReviewSpec {
  userEmail: string;
  productSlug: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase?: boolean;
}

/** Default reviews (5–6). Unique per (user, product). */
export const SEED_REVIEWS: SeedReviewSpec[] = [
  {
    userEmail: "priya.demo@bharmouriroots.com",
    productSlug: "organic-himachali-rajma",
    rating: 5,
    title: "Tastes like home",
    comment:
      "The Rajma from BharmouriRoots is exceptional — creamy texture and rich earthy flavor. Packaging was perfect.",
    isVerifiedPurchase: true,
  },
  {
    userEmail: "rahul.demo@bharmouriroots.com",
    productSlug: "kullu-shawl",
    rating: 5,
    title: "Beautiful craftsmanship",
    comment:
      "Got the Kullu Shawl as a gift and it is stunning. Soft, warm, and the patterns are authentic.",
    isVerifiedPurchase: true,
  },
  {
    userEmail: "anita.demo@bharmouriroots.com",
    productSlug: "himalayan-wild-honey",
    rating: 5,
    title: "Pure liquid gold",
    comment:
      "You can taste the difference from store-bought honey immediately. Beautiful floral notes.",
    isVerifiedPurchase: true,
  },
  {
    userEmail: "vikram.demo@bharmouriroots.com",
    productSlug: "himalayan-walnuts",
    rating: 4,
    title: "Fresh and crunchy",
    comment:
      "Great quality walnuts. Slightly expensive but freshness makes up for it. Will reorder.",
    isVerifiedPurchase: false,
  },
  {
    userEmail: "sunita.demo@bharmouriroots.com",
    productSlug: "himachali-red-apples",
    rating: 5,
    title: "Farm fresh apples",
    comment:
      "The apple box arrived so fresh! Clear difference from what we get locally. Already placing a second order.",
    isVerifiedPurchase: true,
  },
  {
    userEmail: "arun.demo@bharmouriroots.com",
    productSlug: "pahadi-masala",
    rating: 5,
    title: "Fragrance is unmatched",
    comment:
      "Small jar, huge aroma. Transformed everyday dals. Highly recommend this pahadi blend.",
    isVerifiedPurchase: true,
  },
];
