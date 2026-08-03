import { successResponse } from "@/lib/utils/api-response";
import { parseQuery } from "@/lib/utils/query";
import {
  updateUserSchema,
  userListQuerySchema,
} from "@/lib/validators/user.validator";
import { parseJsonBody, type AuthenticatedRequest, type RouteContext } from "@/lib/middleware/with-handler";
import { userService } from "./user.service";

export class UserController {
  async list(request: AuthenticatedRequest) {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(userListQuerySchema, searchParams);
    const result = await userService.list(query);
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
