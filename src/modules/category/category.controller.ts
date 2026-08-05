import { successResponse } from "@/lib/utils/api-response";
import { NextRequest } from "next/server";
import { categoryService } from "./category.service";

export class CategoryController {
  async list(_request: NextRequest) {
    const categories = await categoryService.listTopLevelWithCounts();
    return successResponse(categories);
  }
}

export const categoryController = new CategoryController();
