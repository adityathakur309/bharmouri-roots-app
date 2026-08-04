import { successResponse } from "@/lib/utils/api-response";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth.validator";
import { parseJsonBody, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { authService } from "./auth.service";
import {
  appendAuthCookie,
  clearAuthCookieResponse,
} from "@/lib/auth/cookie";

export class AuthController {
  async register(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = registerSchema.parse(body);
    const result = await authService.register(input);
    const res = successResponse(result, {
      message: "Registration successful",
      status: 201,
    });
    return appendAuthCookie(res, result.accessToken);
  }

  async login(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = loginSchema.parse(body);
    const result = await authService.login(input);
    const res = successResponse(result, { message: "Login successful" });
    return appendAuthCookie(res, result.accessToken);
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

  async forgotPassword(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = forgotPasswordSchema.parse(body);
    const result = await authService.forgotPassword(input);
    return successResponse(result, { message: result.message });
  }

  async resetPassword(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = resetPasswordSchema.parse(body);
    const result = await authService.resetPassword(input);
    return successResponse(result, { message: result.message });
  }

  /** Clears HttpOnly auth cookie; client also clears local token storage. */
  async logout() {
    const res = successResponse({ ok: true }, { message: "Logged out" });
    return clearAuthCookieResponse(res);
  }
}

export const authController = new AuthController();
