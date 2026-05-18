import { successResponse } from "@/lib/utils/api-response";
import { registerSchema, loginSchema, updateProfileSchema } from "@/lib/validators/auth.validator";
import { parseJsonBody, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { authService } from "./auth.service";

export class AuthController {
  async register(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = registerSchema.parse(body);
    const result = await authService.register(input);
    return successResponse(result, {
      message: "Registration successful",
      status: 201,
    });
  }

  async login(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = loginSchema.parse(body);
    const result = await authService.login(input);
    return successResponse(result, { message: "Login successful" });
  }

  async getProfile(request: AuthenticatedRequest) {
    const user = await authService.getProfile(request.user.id);
    return successResponse(user);
  }

  async updateProfile(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = updateProfileSchema.parse(body);
    const user = await authService.updateProfile(request.user.id, input);
    return successResponse(user, { message: "Profile updated" });
  }
}

export const authController = new AuthController();
