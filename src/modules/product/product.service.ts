import { NotFoundError, ConflictError } from "@/lib/utils/errors";
import { buildPaginationMeta } from "@/lib/utils/query";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type { ProductInput, ProductQueryInput } from "@/lib/validators/product.validator";
import { productRepository } from "./product.repository";
import { normalizeProductImages } from "@/lib/utils/image-url";
import { Types } from "mongoose";

function mapAttributes(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (raw instanceof Map) {
    return Object.fromEntries(raw.entries()) as Record<string, string>;
  }
  if (typeof raw === "object") {
    return { ...(raw as Record<string, string>) };
  }
  return {};
}

function mapVariant(v: Record<string, unknown>) {
  return {
    id: String(v._id ?? v.id ?? ""),
    name: String(v.name ?? ""),
    sku: String(v.sku ?? ""),
    price: Number(v.price ?? 0),
    salePrice: v.salePrice !== undefined && v.salePrice !== null ? Number(v.salePrice) : undefined,
    stock: Number(v.stock ?? 0),
    weight: v.weight ? String(v.weight) : undefined,
    isActive: v.isActive !== false,
    attributes: mapAttributes(v.attributes),
    sortOrder: Number(v.sortOrder ?? 0),
  };
}

function mapProduct(doc: object) {
  const d = doc as Record<string, unknown>;
  const variants = Array.isArray(d.variants)
    ? (d.variants as Record<string, unknown>[]).map(mapVariant)
    : [];

  return {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    sku: d.sku ? String(d.sku) : undefined,
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
    metaTitle: d.metaTitle ? String(d.metaTitle) : undefined,
    metaDescription: d.metaDescription ? String(d.metaDescription) : undefined,
    isFeatured: d.isFeatured,
    isNew: d.isNewProduct ?? d.isNew,
    isBestseller: d.isBestseller,
    isActive: d.isActive,
    codEnabled: Boolean(d.codEnabled),
    variants,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function normalizeVariants(input: ProductInput["variants"]) {
  if (!input?.length) return [];
  return input.map((v, index) => {
    const doc: Record<string, unknown> = {
      name: v.name,
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      stock: v.stock,
      weight: v.weight,
      isActive: v.isActive ?? true,
      attributes: v.attributes ?? {},
      sortOrder: v.sortOrder ?? index,
    };
    if (v.id && Types.ObjectId.isValid(v.id)) {
      doc._id = new Types.ObjectId(v.id);
    }
    return doc;
  });
}

function deriveStockAndPrice(data: {
  price: number;
  stock: number;
  variants?: ReturnType<typeof normalizeVariants>;
}) {
  const activeVariants = (data.variants ?? []).filter((v) => v.isActive !== false);
  if (activeVariants.length === 0) {
    return { price: data.price, stock: data.stock };
  }
  const stocks = activeVariants.map((v) => Number(v.stock ?? 0));
  const prices = activeVariants.map((v) => {
    const sale = v.salePrice !== undefined && v.salePrice !== null ? Number(v.salePrice) : null;
    return sale !== null && sale > 0 ? sale : Number(v.price ?? 0);
  });
  return {
    stock: stocks.reduce((a, b) => a + b, 0),
    price: Math.min(...prices),
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
    const { Types: MTypes } = await import("mongoose");
    if (MTypes.ObjectId.isValid(idOrSlug) && String(new MTypes.ObjectId(idOrSlug)) === idOrSlug) {
      return this.getById(idOrSlug);
    }
    return this.getBySlug(idOrSlug);
  }

  private mapProductInput(input: Partial<ProductInput>) {
    const { isNew, isNewProduct, variants, ...rest } = input;
    const normalizedVariants =
      variants !== undefined ? normalizeVariants(variants) : undefined;
    const derived =
      normalizedVariants !== undefined
        ? deriveStockAndPrice({
            price: rest.price ?? 0,
            stock: rest.stock ?? 0,
            variants: normalizedVariants,
          })
        : null;

    return {
      ...rest,
      ...(normalizedVariants !== undefined ? { variants: normalizedVariants } : {}),
      ...(derived
        ? {
            // Keep base price as lowest active variant; stock as sum
            price: rest.price ?? derived.price,
            stock: derived.stock,
          }
        : {}),
      ...(isNew !== undefined || isNewProduct !== undefined
        ? { isNewProduct: isNewProduct ?? isNew ?? false }
        : {}),
    };
  }

  async create(input: ProductInput) {
    const data = sanitizeObject(this.mapProductInput(input) as ProductInput);
    const existing = await productRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError("Product slug already exists");

    const { settingService } = await import("@/modules/settings/setting.service");
    const codGloballyEnabled = await settingService.isCodGloballyEnabled();

    const product = await productRepository.create({
      ...(data as Record<string, unknown>),
      isActive: data.isActive ?? false,
      codEnabled: codGloballyEnabled ? Boolean(data.codEnabled) : false,
    });
    return mapProduct(product.toObject());
  }

  async update(id: string, input: Partial<ProductInput>) {
    const data = sanitizeObject(this.mapProductInput(input) as Partial<ProductInput>);

    if (data.codEnabled !== undefined) {
      const { settingService } = await import("@/modules/settings/setting.service");
      const codGloballyEnabled = await settingService.isCodGloballyEnabled();
      if (!codGloballyEnabled) {
        data.codEnabled = false;
      }
    }

    const product = await productRepository.update(id, data as Record<string, unknown>);
    if (!product) throw new NotFoundError("Product not found");
    return mapProduct(product);
  }

  async remove(id: string) {
    const product = await productRepository.delete(id);
    if (!product) throw new NotFoundError("Product not found");
    return mapProduct(product);
  }

  async removeAll() {
    const result = await productRepository.deactivateAllActive();
    return { deactivated: result.modifiedCount ?? 0 };
  }
}

export const productService = new ProductService();
