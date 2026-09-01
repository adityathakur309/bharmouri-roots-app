import { Product } from "@/lib/db/models";
import {
  buildEqualityFilter,
  buildSort,
  getSkip,
} from "@/lib/utils/query";
import type { ProductQueryInput } from "@/lib/validators/product.validator";

const PRODUCT_SORT_MAP = {
  price_asc: { price: 1 as const },
  price_desc: { price: -1 as const },
  rating: { rating: -1 as const },
  newest: { createdAt: -1 as const },
};

export class ProductRepository {
  findMany(query: ProductQueryInput) {
    const filter: Record<string, unknown> = {
      ...buildEqualityFilter({
        isActive: true,
        categorySlug: query.category,
        isFeatured: query.featured ? true : undefined,
      }),
    };

    if (query.search?.trim()) {
      filter.$text = { $search: query.search.trim() };
    }

    const sort = buildSort(query.sort, PRODUCT_SORT_MAP);
    const skip = getSkip(query.page, query.limit);

    return Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Product.countDocuments(filter),
    ]);
  }

  findAllAdmin(query: ProductQueryInput) {
    const filter: Record<string, unknown> = {
      ...buildEqualityFilter({
        categorySlug: query.category,
        isFeatured: query.featured ? true : undefined,
      }),
    };

    if (query.search?.trim()) {
      filter.$text = { $search: query.search.trim() };
    }

    const sort = buildSort(query.sort, PRODUCT_SORT_MAP);
    const skip = getSkip(query.page, query.limit);

    return Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Product.countDocuments(filter),
    ]);
  }

  findById(id: string) {
    return Product.findById(id).lean();
  }

  findBySlug(slug: string) {
    return Product.findOne({ slug, isActive: true }).lean();
  }

  create(data: Record<string, unknown>) {
    return Product.create(data);
  }

  update(id: string, data: Record<string, unknown>) {
    return Product.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  delete(id: string) {
    return Product.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }

  /** Soft-deactivate every active product (admin Delete All). */
  deactivateAllActive() {
    return Product.updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    );
  }
}

export const productRepository = new ProductRepository();
