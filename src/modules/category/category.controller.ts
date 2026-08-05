import { successResponse } from "@/lib/utils/api-response";
import { parseJsonBody, type AuthenticatedRequest, type RouteContext } from "@/lib/middleware/with-handler";
import {
  categorySchema,
  categoryUpdateSchema,
} from "@/lib/validators/category.validator";
import { z } from "zod";
import { NextRequest } from "next/server";
import { categoryService } from "./category.service";

const idSchema = z.object({ id: z.string().min(1) });

export class CategoryController {
  async list(_request: NextRequest) {
    const categories = await categoryService.listTopLevelWithCounts();
    return successResponse(categories);
  }

  async listAdmin(_request: AuthenticatedRequest) {
    const categories = await categoryService.listAdmin();
    return successResponse(categories);
  }

  async create(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = categorySchema.parse(body);
    const category = await categoryService.create(input);
    return successResponse(category, { message: "Category created", status: 201 });
  }

  async update(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = idSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const input = categoryUpdateSchema.parse(body);
    const category = await categoryService.update(id, input);
    return successResponse(category, { message: "Category updated" });
  }

  async remove(_request: AuthenticatedRequest, context: RouteContext) {
    const { id } = idSchema.parse(await context.params);
    const category = await categoryService.remove(id);
    return successResponse(category, { message: "Category deactivated" });
  }

  async removeAll(_request: AuthenticatedRequest) {
    const result = await categoryService.removeAll();
    return successResponse(result, {
      message: `${result.deactivated} category(ies) deactivated`,
    });
  }
}

export const categoryController = new CategoryController();
