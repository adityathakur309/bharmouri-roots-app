import { successResponse } from "@/lib/utils/api-response";
import { parseQuery } from "@/lib/utils/query";
import {
  couponSchema,
  couponQuerySchema,
  couponIdSchema,
} from "@/lib/validators/coupon.validator";
import {
  parseJsonBody,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { couponService } from "./coupon.service";
import { paginationSchema } from "@/lib/utils/query";
import { z } from "zod";

export class CouponController {
  async list(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(couponQuerySchema, searchParams);
    const result = await couponService.list(query);
    return successResponse(result.coupons, { meta: result.meta });
  }

  async getById(_request: NextRequest, context: RouteContext) {
    const { id } = couponIdSchema.parse(await context.params);
    const coupon = await couponService.getById(id);
    return successResponse(coupon);
  }

  async create(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = couponSchema.parse(body);
    const coupon = await couponService.create(input);
    return successResponse(coupon, { message: "Coupon created", status: 201 });
  }

  async update(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = couponIdSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const input = couponSchema.partial().parse(body);
    const coupon = await couponService.update(id, input);
    return successResponse(coupon, { message: "Coupon updated" });
  }

  async remove(_request: AuthenticatedRequest, context: RouteContext) {
    const { id } = couponIdSchema.parse(await context.params);
    const coupon = await couponService.remove(id);
    return successResponse(coupon, { message: "Coupon deactivated" });
  }

  async usage(request: NextRequest, context: RouteContext) {
    const { id } = couponIdSchema.parse(await context.params);
    const { searchParams } = new URL(request.url);
    const q = parseQuery(
      paginationSchema.extend({
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      searchParams
    );
    const result = await couponService.listUsage(id, q.page, q.limit);
    return successResponse(result.usages, {
      meta: { ...result.meta, coupon: result.coupon },
    });
  }
}

export const couponController = new CouponController();
