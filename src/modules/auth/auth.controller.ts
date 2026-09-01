import { successResponse } from "@/lib/utils/api-response";
import {
  registerSchema,
  startRegistrationSchema,
  completeRegistrationSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth.validator";
import { parseJsonBody, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { NextRequest } from "next/server";
import { authService } from "./auth.service";
import { appendAuthCookie, clearAuthCookieResponse } from "@/lib/auth/cookie";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  exchangeGoogleCode,
  isGoogleOAuthConfigured,
  OAUTH_CALLBACK_COOKIE,
  OAUTH_STATE_COOKIE,
  sanitizeCallbackUrl,
} from "@/lib/auth/google-oauth";
import { AUTH_COOKIE } from "@/lib/constants/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export class AuthController {
  /** Step 1: email only — send complete-registration link */
  async startRegistration(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = startRegistrationSchema.parse(body);
    const result = await authService.startRegistration(input);
    return successResponse(result, { message: result.message });
  }

  /** Step 2: name + password after email verification link */
  async completeRegistration(request: NextRequest) {
    const body = await parseJsonBody(request);
    const input = completeRegistrationSchema.parse(body);
    const result = await authService.completeRegistration(input);
    const res = successResponse(result, {
      message: "Registration successful",
      status: 201,
    });
    return appendAuthCookie(res, result.accessToken);
  }

  /** Legacy direct register — still supported for tooling; prefer complete flow */
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

  async getProviders() {
    return successResponse({
      google: isGoogleOAuthConfigured(),
    });
  }

  async googleStart(request: NextRequest) {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
    }

    const { searchParams } = new URL(request.url);
    const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
    const state = createOAuthState();

    const res = NextResponse.redirect(buildGoogleAuthUrl(state));
    res.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    res.cookies.set(OAUTH_CALLBACK_COOKIE, callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  }

  async googleCallback(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    const callbackUrl = sanitizeCallbackUrl(
      cookieStore.get(OAUTH_CALLBACK_COOKIE)?.value ?? "/"
    );

    const fail = (reason: string) =>
      NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(reason)}`, request.url)
      );

    if (error) return fail("google_denied");
    if (!code || !state || !expectedState || state !== expectedState) {
      return fail("google_invalid_state");
    }

    try {
      const profile = await exchangeGoogleCode(code);
      const result = await authService.loginWithGoogle(profile);
      const res = NextResponse.redirect(
        new URL(
          `/oauth-callback?next=${encodeURIComponent(callbackUrl)}`,
          request.url
        )
      );
      appendAuthCookie(res, result.accessToken);
      res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
      res.cookies.set(OAUTH_CALLBACK_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    } catch {
      return fail("google_auth_failed");
    }
  }

  /** Returns session after OAuth redirect (cookie already set). */
  async oauthSession(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return successResponse(null, { message: "No session" });
    }
    try {
      const { verifyAccessToken } = await import("@/lib/utils/auth-helper");
      const payload = verifyAccessToken(token);
      if (!payload) {
        return successResponse(null, { message: "Invalid session" });
      }
      const user = await authService.getProfile(payload.id);
      return successResponse({ user, accessToken: token });
    } catch {
      return successResponse(null, { message: "Invalid session" });
    }
  }
}

export const authController = new AuthController();
