import type { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { Product, Review, User } from "@/lib/db/models";
import { SEED_REVIEWS } from "./data/reviews.data";

export interface ReviewsSeedResult {
  created: number;
  existing: number;
  productsSynced: number;
}

async function syncProductRating(productId: string, session?: ClientSession) {
  const oid = new Types.ObjectId(productId);
  const rows = await Review.aggregate<{ _id: number; count: number }>([
    { $match: { productId: oid, isActive: true } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]).session(session ?? null);

  let total = 0;
  let sum = 0;
  for (const row of rows) {
    total += row.count;
    sum += row._id * row.count;
  }
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

  await Product.findByIdAndUpdate(
    oid,
    { rating: average, reviews: total },
    session ? { session } : undefined
  );
}

/** Insert default reviews if missing; sync product rating/review counts. */
export async function seedReviews(session?: ClientSession): Promise<ReviewsSeedResult> {
  let created = 0;
  let existing = 0;
  const touchedProductIds = new Set<string>();

  for (const item of SEED_REVIEWS) {
    const email = item.userEmail.toLowerCase();
    const userQuery = User.findOne({ email }).select("_id");
    if (session) userQuery.session(session);
    const user = await userQuery;
    if (!user) {
      throw new Error(`Review seed: demo user missing for ${email}. Seed demo users first.`);
    }

    const productQuery = Product.findOne({ slug: item.productSlug }).select("_id");
    if (session) productQuery.session(session);
    const product = await productQuery;
    if (!product) {
      throw new Error(
        `Review seed: product missing for slug "${item.productSlug}". Seed products first.`
      );
    }

    const existingQuery = Review.findOne({
      userId: user._id,
      productId: product._id,
    });
    if (session) existingQuery.session(session);
    const already = await existingQuery;

    if (already) {
      if (!already.isActive) {
        already.isActive = true;
        already.rating = item.rating;
        already.comment = item.comment;
        already.title = item.title;
        already.isVerifiedPurchase = item.isVerifiedPurchase ?? false;
        await already.save(session ? { session } : undefined);
        created += 1;
      } else {
        existing += 1;
      }
      touchedProductIds.add(String(product._id));
      continue;
    }

    const doc = {
      productId: product._id,
      userId: user._id,
      rating: item.rating,
      comment: item.comment,
      title: item.title,
      isVerifiedPurchase: item.isVerifiedPurchase ?? false,
      isActive: true,
    };

    if (session) {
      await Review.create([doc], { session });
    } else {
      await Review.create(doc);
    }
    created += 1;
    touchedProductIds.add(String(product._id));
  }

  for (const productId of touchedProductIds) {
    await syncProductRating(productId, session);
  }

  return { created, existing, productsSynced: touchedProductIds.size };
}
