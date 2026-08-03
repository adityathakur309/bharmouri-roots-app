import { NotFoundError, ConflictError } from "@/lib/utils/errors";
import { buildPaginationMeta } from "@/lib/utils/query";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type { ProductInput, ProductQueryInput } from "@/lib/validators/product.validator";
import { productRepository } from "./product.repository";
import { normalizeProductImages } from "@/lib/utils/image-url";

function mapProduct(doc: object) {
  const d = doc as Record<string, unknown>;
  return {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    category: d.category,
    categorySlug: d.categorySlug,
    price: d.price,
    originalPrice: d.originalPrice,
    discount: d.discount,
    rating: d.rating,
    reviews: d.reviews,
    stock: d.stock,
    images: normalizeProductImages(d.images),
    description: d.description,
    shortDescription: d.shortDescription,
    features: d.features,
    weight: d.weight,
    origin: d.origin,
    badge: d.badge,
    isFeatured: d.isFeatured,
    isNew: d.isNewProduct ?? d.isNew,
    isBestseller: d.isBestseller,
    isActive: d.isActive,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export class ProductService {
  async list(query: ProductQueryInput) {
    const [products, total] = await productRepository.findMany(query);
    return {
      products: products.map((p) => mapProduct(p)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listAdmin(query: ProductQueryInput) {
    const [products, total] = await productRepository.findAllAdmin(query);
    return {
      products: products.map((p) => mapProduct(p)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product || !product.isActive) throw new NotFoundError("Product not found");
    return mapProduct(product);
  }

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product || !product.isActive) throw new NotFoundError("Product not found");
    return mapProduct(product);
  }

  async getByIdOrSlug(idOrSlug: string) {
    const { Types } = await import("mongoose");
    if (Types.ObjectId.isValid(idOrSlug) && String(new Types.ObjectId(idOrSlug)) === idOrSlug) {
      return this.getById(idOrSlug);
    }
    return this.getBySlug(idOrSlug);
  }

  private mapProductInput(input: Partial<ProductInput>) {
    const { isNew, isNewProduct, ...rest } = input;
    return {
      ...rest,
      ...(isNew !== undefined || isNewProduct !== undefined
        ? { isNewProduct: isNewProduct ?? isNew ?? false }
        : {}),
    };
  }

  async create(input: ProductInput) {
    const data = sanitizeObject(this.mapProductInput(input) as ProductInput);
    const existing = await productRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError("Product slug already exists");

    const product = await productRepository.create(data);
    return mapProduct(product.toObject());
  }

  async update(id: string, input: Partial<ProductInput>) {
    const data = sanitizeObject(this.mapProductInput(input) as Partial<ProductInput>);
    const product = await productRepository.update(id, data);
    if (!product) throw new NotFoundError("Product not found");
    return mapProduct(product);
  }

  async remove(id: string) {
    const product = await productRepository.delete(id);
    if (!product) throw new NotFoundError("Product not found");
    return mapProduct(product);
  }
}

export const productService = new ProductService();
