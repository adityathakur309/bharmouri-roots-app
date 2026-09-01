import { Review, type IReview } from "@/lib/db/models/review.model";
import { Types } from "mongoose";
import {
  buildSort,
  getSkip,
  type SortDirection,
} from "@/lib/utils/query";
import type {
  ReviewListQueryInput,
  AdminReviewQueryInput,
} from "@/lib/validators/review.validator";

const REVIEW_SORT_MAP: Record<string, Record<string, SortDirection>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  rating_high: { rating: -1 },
  rating_low: { rating: 1 },
};

export class ReviewRepository {
  findByProduct(productId: string, query: ReviewListQueryInput) {
    const filter: Record<string, unknown> = {
      productId: new Types.ObjectId(productId),
      isActive: true,
      $or: [{ status: "approved" }, { status: { $exists: false } }],
    };
    const sort = buildSort(query.sort, REVIEW_SORT_MAP);
    const skip = getSkip(query.page, query.limit);

    return Promise.all([
      Review.find(filter)
        .populate("userId", "name avatar")
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Review.countDocuments(filter),
    ]);
  }

  findAdmin(query: AdminReviewQueryInput) {
    const filter: Record<string, unknown> = { isActive: true };
    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { comment: { $regex: query.search, $options: "i" } },
        { title: { $regex: query.search, $options: "i" } },
      ];
    }
    const skip = getSkip(query.page, query.limit);
    return Promise.all([
      Review.find(filter)
        .populate("userId", "name email avatar")
        .populate("productId", "name slug images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Review.countDocuments(filter),
    ]);
  }

  findById(id: string) {
    return Review.findById(id)
      .populate("userId", "name avatar email")
      .populate("productId", "name slug images")
      .lean();
  }

  findByUserAndProduct(userId: string, productId: string) {
    return Review.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
  }

  create(data: Partial<IReview>) {
    return Review.create(data);
  }

  update(id: string, data: Partial<IReview>) {
    return Review.findByIdAndUpdate(id, data, { new: true })
      .populate("userId", "name avatar email")
      .populate("productId", "name slug images")
      .lean();
  }

  softDelete(id: string) {
    return Review.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }

  async aggregateSummary(productId: string) {
    const rows = await Review.aggregate<{
      _id: number;
      count: number;
    }>([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          isActive: true,
          $or: [{ status: "approved" }, { status: { $exists: false } }],
        },
      },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    for (const row of rows) {
      distribution[row._id] = row.count;
      total += row.count;
      sum += row._id * row.count;
    }

    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    return { average, total, distribution };
  }
}

export const reviewRepository = new ReviewRepository();
