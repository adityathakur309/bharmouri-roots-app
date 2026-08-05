import { Category, Product } from "@/lib/db/models";
import type { CategoryInput, CategoryUpdateInput } from "@/lib/validators/category.validator";

export class CategoryRepository {
  async findTopLevelActive() {
    return Category.find({ parent: null, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  async findAllTopLevel() {
    return Category.find({ parent: null })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  async findById(id: string) {
    return Category.findById(id).lean();
  }

  async findBySlug(slug: string) {
    return Category.findOne({ slug: slug.toLowerCase() }).lean();
  }

  async create(data: CategoryInput & { parent?: null }) {
    return Category.create({
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description,
      icon: data.icon,
      image: data.image || undefined,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      parent: null,
    });
  }

  async update(id: string, data: CategoryUpdateInput) {
    const payload: Record<string, unknown> = { ...data };
    if (typeof data.slug === "string") payload.slug = data.slug.toLowerCase();
    if (data.image === "") payload.image = undefined;
    return Category.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  }

  async setActive(id: string, isActive: boolean) {
    return Category.findByIdAndUpdate(id, { $set: { isActive } }, { new: true }).lean();
  }

  /** Soft-deactivate (keep products/categorySlug history). */
  async deactivate(id: string) {
    return this.setActive(id, false);
  }

  async deactivateAllActive() {
    return Category.updateMany(
      { isActive: true, parent: null },
      { $set: { isActive: false } }
    );
  }

  /** Product counts keyed by categorySlug (active products only for public counts). */
  async countActiveProductsBySlug(): Promise<Map<string, number>> {
    const rows = await Product.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$categorySlug", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [r._id, r.count]));
  }

  async countAllProductsBySlug(): Promise<Map<string, number>> {
    const rows = await Product.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$categorySlug", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [r._id, r.count]));
  }
}

export const categoryRepository = new CategoryRepository();
