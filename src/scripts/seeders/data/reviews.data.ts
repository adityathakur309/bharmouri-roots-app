export interface SeedReviewSpec {
  userEmail: string;
  productSlug: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase?: boolean;
  status?: "pending" | "approved" | "rejected";
}

/** Reviews against the new HP catalog slugs. */
export const SEED_REVIEWS: SeedReviewSpec[] = [
  {
    userEmail: "priya.demo@bharmouriroots.com",
    productSlug: "chamba-himalayan-rajma",
    rating: 5,
    title: "Tastes like home",
    comment:
      "Chamba rajma is exceptional — creamy texture and rich earthy flavour. Packaging was perfect.",
    isVerifiedPurchase: true,
    status: "approved",
  },
  {
    userEmail: "rahul.demo@bharmouriroots.com",
    productSlug: "traditional-himachali-pahari-topi",
    rating: 5,
    title: "Beautiful craftsmanship",
    comment:
      "Got the Pahari topi as a gift and it is stunning. Soft, warm, and authentically made.",
    isVerifiedPurchase: true,
    status: "approved",
  },
  {
    userEmail: "anita.demo@bharmouriroots.com",
    productSlug: "himachali-multi-flora-raw-honey",
    rating: 5,
    title: "Pure liquid gold",
    comment:
      "You can taste the difference from store-bought honey immediately. Beautiful floral notes.",
    isVerifiedPurchase: true,
    status: "approved",
  },
  {
    userEmail: "vikram.demo@bharmouriroots.com",
    productSlug: "himachali-wild-forest-honey",
    rating: 4,
    title: "Bold forest flavour",
    comment:
      "Deep, robust forest honey. Slightly pricey but freshness makes up for it. Will reorder.",
    isVerifiedPurchase: true,
    status: "approved",
  },
  {
    userEmail: "sunita.demo@bharmouriroots.com",
    productSlug: "himachali-kulath-dal",
    rating: 5,
    title: "Winter comfort",
    comment:
      "Authentic kulath — made a warming pahadi soup. Reminds me of Himachal kitchens.",
    isVerifiedPurchase: true,
    status: "approved",
  },
  {
    userEmail: "arun.demo@bharmouriroots.com",
    productSlug: "himachali-yellow-chilli-lakhori",
    rating: 5,
    title: "Real lakhori heat",
    comment:
      "Distinctive yellow chilli flavour. Transformed everyday dals. Highly recommend.",
    isVerifiedPurchase: true,
    status: "approved",
  },
];
