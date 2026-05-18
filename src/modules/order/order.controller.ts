import { successResponse } from "@/lib/utils/api-response";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyPaymentSchema,
  createRazorpayOrderSchema,
} from "@/lib/validators/order.validator";
import {
  parseJsonBody,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { orderService } from "./order.service";
import type { OrderStatus } from "@/types/order";

export class OrderController {
  async create(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = createOrderSchema.parse(body);
    const order = await orderService.create(request.user.id, input);
    return successResponse(order, { message: "Order created", status: 201 });
  }

  async listMine(request: AuthenticatedRequest) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const result = await orderService.listByUser(request.user.id, page, limit);
    return successResponse(result.orders, { meta: result.meta });
  }

  async listAll(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const status = searchParams.get("status") as OrderStatus | undefined;
    const result = await orderService.listAll(page, limit, status);
    return successResponse(result.orders, { meta: result.meta });
  }

  async getById(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const isAdmin = request.user.role === "admin";
    const order = await orderService.getById(id, request.user.id, isAdmin);
    return successResponse(order);
  }

  async updateStatus(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = updateOrderStatusSchema.parse(body);
    const order = await orderService.updateStatus(id, input);
    return successResponse(order, { message: "Order status updated" });
  }

  async createRazorpayOrder(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const { orderId } = createRazorpayOrderSchema.parse(body);
    const result = await orderService.createRazorpayOrder(orderId, request.user.id);
    return successResponse(result);
  }

  async verifyPayment(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = verifyPaymentSchema.parse(body);
    const order = await orderService.verifyPayment(input.orderId, request.user.id, {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      mockOutcome: input.mockOutcome,
    });
    return successResponse(order, { message: "Payment verified" });
  }

  async getTracking(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const isAdmin = request.user.role === "admin";
    const result = await orderService.getTracking(
      id,
      request.user.id,
      isAdmin
    );
    return successResponse(result);
  }

  async createShipment(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const order = await orderService.createShipment(id);
    return successResponse(order, { message: "Shipment created" });
  }
}

export const orderController = new OrderController();
