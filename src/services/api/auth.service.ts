import { apiRequest, setStoredToken } from "./client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  /** Step 1 — send verify / complete-registration email */
  startRegistration: (email: string) =>
    apiRequest<{ message: string; email: string }>("post", "/auth/register/start", {
      email,
    }),

  /** Step 2 — create account after email link */
  completeRegistration: async (data: {
    name: string;
    email: string;
    password: string;
    token: string;
    phone?: string;
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
    const res = await apiRequest<AuthResponse>("post", "/auth/login", data);
    setStoredToken(res.data.accessToken);
    return res.data;
  },

  getProfile: () => apiRequest<AuthUser>("get", "/auth/me"),

  updateProfile: (data: Partial<Pick<AuthUser, "name" | "phone" | "avatar">>) =>
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
};
