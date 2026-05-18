import { Product, type IProduct } from "@/lib/db/models";
import type { ProductQueryInput } from "@/lib/validators/product.validator";
export class ProductRepository {
  findMany(query: ProductQueryInput) {
    const filter: Record<string, unknown> = { isActive: true };

    if (query.category) filter.categorySlug = query.category;
    if (query.featured) filter.isFeatured = true;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (query.sort) {
      case "price_asc":
        sort = { price: 1 };
        break;
      case "price_desc":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { rating: -1 };
        break;
      case "newest":
        sort = { createdAt: -1 };
        break;
    }

    const skip = (query.page - 1) * query.limit;

    return Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Product.countDocuments(filter),
    ]);
  }

  findAllAdmin(query: ProductQueryInput) {
    const filter: Record<string, unknown> = {};
    if (query.search) filter.$text = { $search: query.search };
    if (query.category) filter.categorySlug = query.category;

    const skip = (query.page - 1) * query.limit;
    return Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      Product.countDocuments(filter),
    ]);
  }

  findById(id: string) {
    return Product.findById(id).lean();
  }

  findBySlug(slug: string) {
    return Product.findOne({ slug, isActive: true }).lean();
  }

  create(data: Partial<IProduct>) {
    return Product.create(data);
  }

  update(id: string, data: Partial<IProduct>) {
    return Product.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  delete(id: string) {
    return Product.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }

  hardDelete(id: string) {
    return Product.findByIdAndDelete(id);
  }
}

export const productRepository = new ProductRepository();
