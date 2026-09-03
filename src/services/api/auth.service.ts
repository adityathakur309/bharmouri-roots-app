import { apiRequest, setStoredToken } from "./client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  mfaEnabled?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export type LoginResult =
  | (AuthResponse & { requiresMfa: false })
  | {
      requiresMfa: true;
      mfaToken: string;
      email: string;
      maskedEmail: string;
      message: string;
    };

export const authApi = {
  /** Step 1 — send registration OTP */
  startRegistration: (email: string) =>
    apiRequest<{ message: string; email: string; maskedEmail: string }>(
      "post",
      "/auth/register/start",
      { email }
    ),

  /** Step 1b — verify registration OTP → registration token */
  verifyRegistrationOtp: (data: { email: string; code: string }) =>
    apiRequest<{ message: string; email: string; token: string }>(
      "post",
      "/auth/register/verify-otp",
      data
    ),

  /** Step 2 — create account after email verification */
  completeRegistration: async (data: {
    name: string;
    email: string;
    password: string;
    token: string;
    phone?: string;
    mfaEnabled?: boolean;
  }) => {
    const res = await apiRequest<AuthResponse>("post", "/auth/register/complete", data);
    setStoredToken(res.data.accessToken);
    return res.data;
  },

  /** Legacy direct register (prefer completeRegistration) */
  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await apiRequest<AuthResponse>("post", "/auth/register", data);
    setStoredToken(res.data.accessToken);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiRequest<LoginResult>("post", "/auth/login", data);
    if (!res.data.requiresMfa) {
      setStoredToken(res.data.accessToken);
    }
    return res.data;
  },

  verifyLoginOtp: async (data: { mfaToken: string; code: string }) => {
    const res = await apiRequest<AuthResponse>("post", "/auth/login/verify-otp", data);
    setStoredToken(res.data.accessToken);
    return res.data;
  },

  getProfile: () => apiRequest<AuthUser>("get", "/auth/me"),

  updateProfile: (data: Partial<Pick<AuthUser, "name" | "phone" | "avatar" | "mfaEnabled">>) =>
    apiRequest<AuthUser>("patch", "/auth/me", data),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("post", "/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiRequest<{ message: string }>("post", "/auth/reset-password", data),

  logout: async () => {
    try {
      await apiRequest<{ ok: boolean }>("post", "/auth/logout");
    } catch {
      // Client logout must succeed even if the network call fails
    }
    setStoredToken(null);
  },

  getProviders: () =>
    apiRequest<{ google: boolean }>("get", "/auth/providers"),

  oauthSession: () =>
    apiRequest<{ user: AuthUser; accessToken: string } | null>("get", "/auth/oauth-session"),
};
