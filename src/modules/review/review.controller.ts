import { Types } from "mongoose";
import { Product } from "@/lib/db/models";
import { NotFoundError } from "@/lib/utils/errors";
import { parseQuery } from "@/lib/utils/query";
import { successResponse } from "@/lib/utils/api-response";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewListQuerySchema,
} from "@/lib/validators/review.validator";
import {
  parseJsonBody,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { reviewService } from "./review.service";

async function resolveProductId(idOrSlug: string): Promise<string> {
  if (Types.ObjectId.isValid(idOrSlug) && String(new Types.ObjectId(idOrSlug)) === idOrSlug) {
    const byId = await Product.findById(idOrSlug).select("_id").lean();
    if (byId) return String(byId._id);
  }
  const bySlug = await Product.findOne({ slug: idOrSlug }).select("_id").lean();
  if (!bySlug) throw new NotFoundError("Product not found");
  return String(bySlug._id);
}

export class ReviewController {
  async list(request: NextRequest, context: RouteContext) {
    const { id } = await context.params;
    const productId = await resolveProductId(id);
    const { searchParams } = new URL(request.url);
    const query = parseQuery(reviewListQuerySchema, searchParams);
    const result = await reviewService.listByProduct(productId, query);
    return successResponse(result.reviews, {
      meta: { ...result.meta, summary: result.summary },
    });
  }

  async create(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const productId = await resolveProductId(id);
    const body = await parseJsonBody(request);
    const input = createReviewSchema.parse(body);
    const review = await reviewService.create(productId, request.user.id, input);
    return successResponse(review, {
      message: "Review submitted for moderation",
      status: 201,
    });
  }

  async mine(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const productId = await resolveProductId(id);
    const review = await reviewService.getMineForProduct(productId, request.user.id);
    return successResponse(review);
  }

  async eligibility(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const productId = await resolveProductId(id);
    const result = await reviewService.canReview(productId, request.user.id);
    return successResponse(result);
  }

  async listAdmin(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const { adminReviewQuerySchema } = await import(
      "@/lib/validators/review.validator"
    );
    const query = parseQuery(adminReviewQuerySchema, searchParams);
    const result = await reviewService.listAdmin(query);
    return successResponse(result.reviews, { meta: result.meta });
  }

  async moderate(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const { moderateReviewSchema } = await import(
      "@/lib/validators/review.validator"
    );
    const input = moderateReviewSchema.parse(body);
    const review = await reviewService.moderate(id, request.user.id, input);
    return successResponse(review, { message: `Review ${input.status}` });
  }

  async update(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = updateReviewSchema.parse(body);
    const review = await reviewService.update(
      id,
      request.user.id,
      request.user.role,
      input
    );
    return successResponse(review, { message: "Review updated" });
  }

  async remove(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const result = await reviewService.remove(id, request.user.id, request.user.role);
    return successResponse(result, { message: "Review deleted" });
  }
}

export const reviewController = new ReviewController();
