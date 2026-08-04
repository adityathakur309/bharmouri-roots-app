import type { ClientSession } from "mongoose";
import { Product } from "@/lib/db/models";
import { LEGACY_SEED_PRODUCT_SLUGS, SEED_PRODUCTS } from "./data/products.data";

export interface ProductSeedResult {
  upserted: number;
  deactivatedLegacy: number;
}

/** Upsert the curated seed catalog by slug (idempotent; never deletes). */
export async function seedProducts(session?: ClientSession): Promise<ProductSeedResult> {
  let upserted = 0;
  const keepSlugs = SEED_PRODUCTS.map((p) => p.slug);

  for (const p of SEED_PRODUCTS) {
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          category: p.category,
          categorySlug: p.categorySlug,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          stock: p.stock,
          images: p.images,
          description: p.description,
          shortDescription: p.shortDescription,
          features: p.features,
          weight: p.weight,
          origin: p.origin,
          badge: p.badge,
          isFeatured: p.isFeatured ?? false,
          isNewProduct: p.isNewProduct ?? false,
          isBestseller: p.isBestseller ?? false,
          isActive: true,
        },
        $setOnInsert: {
          rating: 0,
          reviews: 0,
        },
      },
      { upsert: true, returnDocument: "after", ...(session ? { session } : {}) }
    );
    upserted += 1;
  }

  // Soft-retire older seed items removed from the curated list (admin can hard-delete later)
  const legacyToDisable = LEGACY_SEED_PRODUCT_SLUGS.filter((slug) => !keepSlugs.includes(slug));
  const deactivateResult = await Product.updateMany(
    { slug: { $in: legacyToDisable }, isActive: true },
    { $set: { isActive: false } },
    session ? { session } : undefined
  );

  return {
    upserted,
    deactivatedLegacy: deactivateResult.modifiedCount ?? 0,
  };
}
