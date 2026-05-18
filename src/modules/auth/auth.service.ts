import {
  hashPassword,
  comparePassword,
  signAccessToken,
  toPublicUser,
} from "@/lib/utils/auth-helper";
import { ConflictError, UnauthorizedError, NotFoundError } from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type { RegisterInput, LoginInput, UpdateProfileInput } from "@/lib/validators/auth.validator";
import { authRepository } from "./auth.repository";

export class AuthService {
  async register(input: RegisterInput) {
    const data = sanitizeObject(input);
    const existing = await authRepository.findByEmail(data.email);
    if (existing) throw new ConflictError("Email already registered");

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const hashed = await hashPassword(data.password);

    const user = await authRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      phone: data.phone,
      role: data.email.toLowerCase() === adminEmail ? "admin" : "user",
    });

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    return { user: publicUser, accessToken };
  }

  async login(input: LoginInput) {
    const user = await authRepository.findByEmailWithPassword(input.email.toLowerCase());
    if (!user?.password) throw new UnauthorizedError("Invalid email or password");

    const valid = await comparePassword(input.password, user.password);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    return { user: publicUser, accessToken };
  }

  async getProfile(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data = sanitizeObject(input);
    const user = await authRepository.updateById(userId, data);
    if (!user) throw new NotFoundError("User not found");
    return toPublicUser(user);
  }
}

export const authService = new AuthService();
