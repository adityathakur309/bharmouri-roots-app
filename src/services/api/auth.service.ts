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

  logout: () => {
    setStoredToken(null);
  },
};
