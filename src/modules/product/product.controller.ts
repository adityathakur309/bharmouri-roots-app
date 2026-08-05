import { successResponse } from "@/lib/utils/api-response";
import { parseQuery } from "@/lib/utils/query";
import {
  productSchema,
  productQuerySchema,
  productIdSchema,
} from "@/lib/validators/product.validator";
import { parseJsonBody, type AuthenticatedRequest, type RouteContext } from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { productService } from "./product.service";

export class ProductController {
  async list(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(productQuerySchema, searchParams);
    const result = await productService.list(query);
    return successResponse(result.products, { meta: result.meta });
  }

  async listAdmin(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(productQuerySchema, searchParams);
    const result = await productService.listAdmin(query);
    return successResponse(result.products, { meta: result.meta });
  }

  async getById(_request: NextRequest, context: RouteContext) {
    const { id } = productIdSchema.parse(await context.params);
    const product = await productService.getByIdOrSlug(id);
    return successResponse(product);
  }

  async create(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = productSchema.parse(body);
    const product = await productService.create(input);
    return successResponse(product, { message: "Product created", status: 201 });
  }

  async update(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = productIdSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const input = productSchema.partial().parse(body);
    const product = await productService.update(id, input);
    return successResponse(product, { message: "Product updated" });
  }

  async remove(_request: AuthenticatedRequest, context: RouteContext) {
    const { id } = productIdSchema.parse(await context.params);
    const product = await productService.remove(id);
    return successResponse(product, { message: "Product deactivated" });
  }

  async removeAll(_request: AuthenticatedRequest) {
    const result = await productService.removeAll();
    return successResponse(result, {
      message: `${result.deactivated} product(s) deactivated`,
    });
  }
}

export const productController = new ProductController();
