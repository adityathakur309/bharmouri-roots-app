import { NotFoundError } from "@/lib/utils/errors";
import { toPublicUser } from "@/lib/utils/auth-helper";
import { buildPaginationMeta } from "@/lib/utils/query";
import type { UserListQueryInput } from "@/lib/validators/user.validator";
import { userRepository } from "./user.repository";

export class UserService {
  async list(query: UserListQueryInput) {
    const [users, total] = await userRepository.findAll(query);
    return {
      users: users.map((u) => toPublicUser(u as Parameters<typeof toPublicUser>[0])),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return toPublicUser(user as Parameters<typeof toPublicUser>[0]);
  }

  async update(
    id: string,
    data: { role?: "user" | "admin"; isActive?: boolean }
  ) {
    const user = await userRepository.update(id, {
      ...(data.role !== undefined && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    });
    if (!user) throw new NotFoundError("User not found");
    return toPublicUser(user as Parameters<typeof toPublicUser>[0]);
  }
}

export const userService = new UserService();
