import { z } from "zod";
import { successResponse } from "@/lib/utils/api-response";
import { parseJsonBody, type AuthenticatedRequest, type RouteContext } from "@/lib/middleware/with-handler";
import { userService } from "./user.service";

const updateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

export class UserController {
  async list(request: AuthenticatedRequest) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const search = searchParams.get("search") ?? undefined;
    const result = await userService.list(page, limit, search);
    return successResponse(result.users, { meta: result.meta });
  }

  async getById(_request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const user = await userService.getById(id);
    return successResponse(user);
  }

  async update(_request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(_request);
    const input = updateUserSchema.parse(body);
    const user = await userService.update(id, input);
    return successResponse(user, { message: "User updated" });
  }
}

export const userController = new UserController();
