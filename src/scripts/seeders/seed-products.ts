import type { ClientSession } from "mongoose";
import { Order, Product } from "@/lib/db/models";
import { LEGACY_SEED_PRODUCT_SLUGS, SEED_PRODUCTS } from "./data/products.data";

export interface ProductSeedResult {
  upserted: number;
  deactivatedLegacy: number;
  purgedInactive: number;
}

/**
 * Upsert curated catalog by slug (idempotent).
 * Soft-deactivates products not in the new catalog — never hard-deletes
 * order-linked items (order line snapshots stay intact).
 *
 * Set SEED_PURGE_INACTIVE_PRODUCTS=true to hard-delete inactive products
 * that are not referenced on any order line.
 */
export async function seedProducts(session?: ClientSession): Promise<ProductSeedResult> {
  let upserted = 0;
  const keepSlugs = SEED_PRODUCTS.map((p) => p.slug);

  for (const p of SEED_PRODUCTS) {
    const variants = (p.variants ?? []).map((v, index) => ({
      name: v.name,
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      stock: v.stock,
      weight: v.weight,
      isActive: v.isActive ?? true,
      attributes: v.attributes ?? {},
      sortOrder: v.sortOrder ?? index,
    }));

    const activeVariantStock = variants
      .filter((v) => v.isActive !== false)
      .reduce((sum, v) => sum + v.stock, 0);

    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          category: p.category,
          categorySlug: p.categorySlug,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          stock: variants.length ? activeVariantStock : p.stock,
          images: p.images,
          description: p.description,
          shortDescription: p.shortDescription,
          features: p.features,
          weight: p.weight,
          origin: p.origin,
          badge: p.badge,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          isFeatured: p.isFeatured ?? false,
          isNewProduct: p.isNewProduct ?? false,
          isBestseller: p.isBestseller ?? false,
          codEnabled: p.codEnabled ?? false,
          variants,
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

  const deactivateResult = await Product.updateMany(
    {
      isActive: true,
      slug: { $nin: keepSlugs },
    },
    { $set: { isActive: false } },
    session ? { session } : undefined
  );

  void LEGACY_SEED_PRODUCT_SLUGS;

  let purgedInactive = 0;
  if (process.env.SEED_PURGE_INACTIVE_PRODUCTS === "true") {
    const orderSlugs = await Order.distinct("items.slug");
    const protectedSlugs = new Set([...keepSlugs, ...orderSlugs.map(String)]);
    const purgeResult = await Product.deleteMany(
      { isActive: false, slug: { $nin: [...protectedSlugs] } },
      session ? { session } : undefined
    );
    purgedInactive = purgeResult.deletedCount ?? 0;
  }

  return {
    upserted,
    deactivatedLegacy: deactivateResult.modifiedCount ?? 0,
    purgedInactive,
  };
}
