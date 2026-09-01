import { Types } from "mongoose";
import { Product, Order } from "@/lib/db/models";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { buildPaginationMeta } from "@/lib/utils/query";
import { formatDate } from "@/lib/utils";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewListQueryInput,
  AdminReviewQueryInput,
  ModerateReviewInput,
} from "@/lib/validators/review.validator";
import { reviewRepository } from "./review.repository";

function mapReview(doc: unknown) {
  const d = doc as Record<string, unknown>;
  const user = d.userId as Record<string, unknown> | undefined;
  const product = d.productId as Record<string, unknown> | undefined;
  const name = user?.name ? String(user.name) : "Customer";
  const avatar =
    (user?.avatar as string | undefined) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2d6a4f&color=fff`;

  const productId =
    product && typeof product === "object" && product._id
      ? String(product._id)
      : String(d.productId);

  return {
    id: String(d._id),
    productId,
    productName: product?.name ? String(product.name) : undefined,
    productSlug: product?.slug ? String(product.slug) : undefined,
    productImage: Array.isArray(product?.images)
      ? String((product.images as string[])[0] ?? "")
      : undefined,
    userId: user?._id ? String(user._id) : String(d.userId),
    userEmail: user?.email ? String(user.email) : undefined,
    name,
    avatar,
    rating: d.rating as number,
    comment: d.comment as string,
    title: (d.title as string | undefined) ?? undefined,
    verified: Boolean(d.isVerifiedPurchase),
    status: (d.status as string) ?? "pending",
    rejectionReason: d.rejectionReason ? String(d.rejectionReason) : undefined,
    date: d.createdAt
      ? formatDate(new Date(d.createdAt as string))
      : "",
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    moderatedAt: d.moderatedAt,
  };
}

async function syncProductRating(productId: string) {
  const summary = await reviewRepository.aggregateSummary(productId);
  await Product.findByIdAndUpdate(productId, {
    rating: summary.average,
    reviews: summary.total,
  });
  return summary;
}

async function hasVerifiedPurchase(userId: string, productId: string) {
  const count = await Order.countDocuments({
    userId: new Types.ObjectId(userId),
    paymentStatus: { $in: ["paid", "pending"] },
    status: { $nin: ["cancelled", "payment_pending"] },
    "items.productId": new Types.ObjectId(productId),
  });
  return count > 0;
}

export class ReviewService {
  async listByProduct(productId: string, query: ReviewListQueryInput) {
    const product = await Product.findById(productId).select("_id").lean();
    if (!product) throw new NotFoundError("Product not found");

    const [reviews, total] = await reviewRepository.findByProduct(productId, query);
    const summary = await reviewRepository.aggregateSummary(productId);

    return {
      reviews: reviews.map((r) => mapReview(r)),
      summary,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listAdmin(query: AdminReviewQueryInput) {
    const [reviews, total] = await reviewRepository.findAdmin(query);
    return {
      reviews: reviews.map((r) => mapReview(r)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async canReview(productId: string, userId: string) {
    const purchased = await hasVerifiedPurchase(userId, productId);
    const existing = await reviewRepository.findByUserAndProduct(userId, productId);
    const hasActive = Boolean(existing?.isActive);
    return {
      canSubmit: purchased && !hasActive,
      purchased,
      hasReview: hasActive,
      myReview: hasActive && existing ? mapReview(await reviewRepository.findById(String(existing._id))) : null,
    };
  }

  async create(productId: string, userId: string, input: CreateReviewInput) {
    const product = await Product.findById(productId).select("_id isActive").lean();
    if (!product || !product.isActive) throw new NotFoundError("Product not found");

    const purchased = await hasVerifiedPurchase(userId, productId);
    if (!purchased) {
      throw new ForbiddenError("Only customers who purchased this product can leave a review");
    }

    const existing = await reviewRepository.findByUserAndProduct(userId, productId);
    if (existing?.isActive) {
      throw new ConflictError("You have already reviewed this product");
    }

    const data = sanitizeObject({ ...input });

    if (existing && !existing.isActive) {
      existing.rating = data.rating;
      existing.comment = data.comment;
      existing.title = data.title;
      existing.isVerifiedPurchase = true;
      existing.status = "pending";
      existing.isActive = true;
      existing.rejectionReason = undefined;
      existing.moderatedAt = undefined;
      await existing.save();
      // Pending reviews do not affect public rating
      const refreshed = await reviewRepository.findById(String(existing._id));
      return mapReview(refreshed);
    }

    try {
      const review = await reviewRepository.create({
        productId: new Types.ObjectId(productId),
        userId: new Types.ObjectId(userId),
        rating: data.rating,
        comment: data.comment,
        title: data.title,
        isVerifiedPurchase: true,
        status: "pending",
        isActive: true,
      });
      const populated = await reviewRepository.findById(String(review._id));
      return mapReview(populated);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: number }).code === 11000
      ) {
        throw new ConflictError("You have already reviewed this product");
      }
      throw error;
    }
  }

  async update(
    reviewId: string,
    userId: string,
    role: "user" | "admin",
    input: UpdateReviewInput
  ) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || !review.isActive) throw new NotFoundError("Review not found");

    const ownerId =
      typeof review.userId === "object" && review.userId && "_id" in review.userId
        ? String((review.userId as { _id: Types.ObjectId })._id)
        : String(review.userId);

    if (ownerId !== userId && role !== "admin") {
      throw new ForbiddenError("You can only edit your own review");
    }

    if (!input.rating && !input.comment && input.title === undefined) {
      throw new ValidationError("Nothing to update");
    }

    const data = sanitizeObject({ ...input }) as UpdateReviewInput & {
      status?: "pending" | "approved" | "rejected";
    };

    // Customer edits return the review to pending moderation
    if (role !== "admin") {
      data.status = "pending";
    }

    const updated = await reviewRepository.update(reviewId, data);
    const productId =
      typeof review.productId === "object" && review.productId && "_id" in review.productId
        ? String((review.productId as { _id: Types.ObjectId })._id)
        : String(review.productId);
    await syncProductRating(productId);
    return mapReview(updated);
  }

  async moderate(reviewId: string, adminId: string, input: ModerateReviewInput) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || !review.isActive) throw new NotFoundError("Review not found");

    const updated = await reviewRepository.update(reviewId, {
      status: input.status,
      rejectionReason:
        input.status === "rejected" ? input.rejectionReason ?? "Rejected by admin" : undefined,
      moderatedAt: new Date(),
      moderatedBy: new Types.ObjectId(adminId),
    });

    const productId =
      typeof review.productId === "object" && review.productId && "_id" in review.productId
        ? String((review.productId as { _id: Types.ObjectId })._id)
        : String(review.productId);
    await syncProductRating(productId);
    return mapReview(updated);
  }

  async remove(reviewId: string, userId: string, role: "user" | "admin") {
    const review = await reviewRepository.findById(reviewId);
    if (!review || !review.isActive) throw new NotFoundError("Review not found");

    const ownerId =
      typeof review.userId === "object" && review.userId && "_id" in review.userId
        ? String((review.userId as { _id: Types.ObjectId })._id)
        : String(review.userId);

    if (ownerId !== userId && role !== "admin") {
      throw new ForbiddenError("You can only delete your own review");
    }

    await reviewRepository.softDelete(reviewId);
    const productId =
      typeof review.productId === "object" && review.productId && "_id" in review.productId
        ? String((review.productId as { _id: Types.ObjectId })._id)
        : String(review.productId);
    const summary = await syncProductRating(productId);
    return { deleted: true, summary };
  }

  async getMineForProduct(productId: string, userId: string) {
    const review = await reviewRepository.findByUserAndProduct(userId, productId);
    if (!review || !review.isActive) return null;
    const populated = await reviewRepository.findById(String(review._id));
    return mapReview(populated);
  }
}

export const reviewService = new ReviewService();
