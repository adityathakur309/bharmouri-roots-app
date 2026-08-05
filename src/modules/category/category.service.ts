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
    isActive: doc.isActive as boolean | undefined,
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
      const slug = String(d.slug);
      return mapCategory(d, counts.get(slug) ?? 0);
    });
  }
}

export const categoryService = new CategoryService();
