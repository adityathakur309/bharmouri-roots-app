import type { ClientSession } from "mongoose";
import { Category } from "@/lib/db/models";
import { SEED_CATEGORIES } from "./data/categories.data";

export interface CategorySeedResult {
  categoriesUpserted: number;
  subcategoriesUpserted: number;
}

export async function seedCategories(session?: ClientSession): Promise<CategorySeedResult> {
  let categoriesUpserted = 0;
  let subcategoriesUpserted = 0;

  for (const cat of SEED_CATEGORIES) {
    const parent = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          image: cat.image,
          parent: null,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after", ...(session ? { session } : {}) }
    );

    if (!parent) {
      throw new Error(`Failed to upsert category: ${cat.slug}`);
    }
    categoriesUpserted += 1;

    let subOrder = 1;
    for (const sub of cat.subcategories) {
      await Category.findOneAndUpdate(
        { slug: sub.slug },
        {
          $set: {
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            parent: parent._id,
            sortOrder: subOrder,
            isActive: true,
          },
        },
        { upsert: true, returnDocument: "after", ...(session ? { session } : {}) }
      );
      subcategoriesUpserted += 1;
      subOrder += 1;
    }
  }

  return { categoriesUpserted, subcategoriesUpserted };
}
