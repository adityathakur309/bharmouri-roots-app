import type { ClientSession } from "mongoose";
import { Product } from "@/lib/db/models";
import { products } from "@/lib/mock-data";

export interface ProductSeedResult {
  upserted: number;
}

/** Upsert catalog products by unique slug (idempotent; never deletes). */
export async function seedProducts(session?: ClientSession): Promise<ProductSeedResult> {
  let upserted = 0;

  for (const p of products) {
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
          rating: p.rating,
          reviews: p.reviews,
          stock: p.stock,
          images: p.images,
          description: p.description,
          shortDescription: p.shortDescription,
          features: p.features,
          weight: p.weight,
          origin: p.origin,
          badge: p.badge,
          isFeatured: p.isFeatured ?? false,
          isNewProduct: p.isNew ?? false,
          isBestseller: p.isBestseller ?? false,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after", ...(session ? { session } : {}) }
    );
    upserted += 1;
  }

  return { upserted };
}
