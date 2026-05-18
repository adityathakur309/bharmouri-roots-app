import { NotFoundError } from "@/lib/utils/errors";
import { toPublicUser } from "@/lib/utils/auth-helper";
import { userRepository } from "./user.repository";

export class UserService {
  async list(page = 1, limit = 20, search?: string) {
    const [users, total] = await userRepository.findAll(page, limit, search);
    return {
      users: users.map((u) => toPublicUser(u as Parameters<typeof toPublicUser>[0])),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
