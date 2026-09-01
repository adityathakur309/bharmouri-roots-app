import { successResponse } from "@/lib/utils/api-response";
import { parseQuery } from "@/lib/utils/query";
import {
  createRefundRequestSchema,
  adminRefundQuerySchema,
  reviewRefundSchema,
  qualityCheckSchema,
  schedulePickupSchema,
  completePickupSchema,
  initiateRefundSchema,
} from "@/lib/validators/refund.validator";
import {
  parseJsonBody,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { refundService } from "./refund.service";
import { paginationSchema } from "@/lib/utils/query";
import { z } from "zod";

export class RefundController {
  async create(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = createRefundRequestSchema.parse(body);
    const refund = await refundService.create(request.user.id, input);
    return successResponse(refund, {
      message: "Refund request submitted",
      status: 201,
    });
  }

  async listMine(request: AuthenticatedRequest) {
    const { searchParams } = new URL(request.url);
    const q = parseQuery(
      paginationSchema.extend({
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
      searchParams
    );
    const result = await refundService.listMine(request.user.id, q.page, q.limit);
    return successResponse(result.refunds, { meta: result.meta });
  }

  async getMine(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const refund = await refundService.getById(id, request.user.id, false);
    return successResponse(refund);
  }

  async listAdmin(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(adminRefundQuerySchema, searchParams);
    const result = await refundService.listAdmin(query);
    return successResponse(result.refunds, { meta: result.meta });
  }

  async getAdmin(_request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const refund = await refundService.getById(id, undefined, true);
    return successResponse(refund);
  }

  async review(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = reviewRefundSchema.parse(body);
    const refund = await refundService.review(id, request.user.id, input);
    return successResponse(refund, { message: "Refund review updated" });
  }

  async qualityCheck(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = qualityCheckSchema.parse(body);
    const refund = await refundService.qualityCheck(id, request.user.id, input);
    return successResponse(refund, { message: "Quality check recorded" });
  }

  async schedulePickup(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = schedulePickupSchema.parse(body ?? {});
    const refund = await refundService.schedulePickup(id, request.user.id, input);
    return successResponse(refund, { message: "Pickup scheduled" });
  }

  async completePickup(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = completePickupSchema.parse(body ?? {});
    const refund = await refundService.completePickup(id, request.user.id, input);
    return successResponse(refund, { message: "Pickup completed" });
  }

  async initiateRefund(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = initiateRefundSchema.parse(body ?? {});
    const refund = await refundService.initiateRefund(id, request.user.id, input);
    return successResponse(refund, { message: "Refund processed" });
  }
}

export const refundController = new RefundController();
