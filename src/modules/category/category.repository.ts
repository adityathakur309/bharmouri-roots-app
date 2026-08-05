import { Category } from "@/lib/db/models";
import { Product } from "@/lib/db/models";

export class CategoryRepository {
  async findTopLevelActive() {
    return Category.find({ parent: null, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  /** Product counts keyed by categorySlug (top-level product filter slug). */
  async countActiveProductsBySlug(): Promise<Map<string, number>> {
    const rows = await Product.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$categorySlug", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [r._id, r.count]));
  }
}

export const categoryRepository = new CategoryRepository();
