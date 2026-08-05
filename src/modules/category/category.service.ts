import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type { CategoryInput, CategoryUpdateInput } from "@/lib/validators/category.validator";
import { categoryRepository } from "./category.repository";

function mapCategory(
  doc: Record<string, unknown>,
  productCount: number
) {
  return {
    id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    description: (doc.description as string | undefined) ?? "",
    icon: (doc.icon as string | undefined) ?? "",
    image: (doc.image as string | undefined) ?? "",
    sortOrder: (doc.sortOrder as number) ?? 0,
    productCount,
    isActive: doc.isActive !== false,
  };
}

export class CategoryService {
  async listTopLevelWithCounts() {
    const [categories, counts] = await Promise.all([
      categoryRepository.findTopLevelActive(),
      categoryRepository.countActiveProductsBySlug(),
    ]);

    return categories.map((cat) => {
      const d = cat as unknown as Record<string, unknown>;
      return mapCategory(d, counts.get(String(d.slug)) ?? 0);
    });
  }

  async listAdmin() {
    const [categories, counts] = await Promise.all([
      categoryRepository.findAllTopLevel(),
      categoryRepository.countAllProductsBySlug(),
    ]);

    return categories.map((cat) => {
      const d = cat as unknown as Record<string, unknown>;
      return mapCategory(d, counts.get(String(d.slug)) ?? 0);
    });
  }

  async create(input: CategoryInput) {
    const data = sanitizeObject(input);
    const existing = await categoryRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError("Category slug already exists");

    const created = await categoryRepository.create({
      ...data,
      isActive: data.isActive ?? true,
    });
    return mapCategory(created.toObject() as unknown as Record<string, unknown>, 0);
  }

  async update(id: string, input: CategoryUpdateInput) {
    const data = sanitizeObject(input);
    if (data.slug) {
      const existing = await categoryRepository.findBySlug(data.slug);
      if (existing && String((existing as { _id: unknown })._id) !== id) {
        throw new ConflictError("Category slug already exists");
      }
    }

    const updated = await categoryRepository.update(id, data);
    if (!updated) throw new NotFoundError("Category not found");

    const counts = await categoryRepository.countAllProductsBySlug();
    const d = updated as unknown as Record<string, unknown>;
    return mapCategory(d, counts.get(String(d.slug)) ?? 0);
  }

  async setActive(id: string, isActive: boolean) {
    const updated = await categoryRepository.setActive(id, isActive);
    if (!updated) throw new NotFoundError("Category not found");
    const counts = await categoryRepository.countAllProductsBySlug();
    const d = updated as unknown as Record<string, unknown>;
    return mapCategory(d, counts.get(String(d.slug)) ?? 0);
  }

  async remove(id: string) {
    // Soft delete — keeps product.categorySlug references valid for admin history
    return this.setActive(id, false);
  }

  async removeAll() {
    const result = await categoryRepository.deactivateAllActive();
    return { deactivated: result.modifiedCount ?? 0 };
  }
}

export const categoryService = new CategoryService();
