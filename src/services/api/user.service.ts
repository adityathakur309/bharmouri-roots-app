import { apiRequest } from "./client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export const userApi = {
  adminList: (params?: { page?: number; limit?: number; search?: string }) =>
    apiRequest<AdminUser[]>("get", "/admin/users", undefined, params as Record<string, unknown>),

  update: (id: string, data: { role?: "user" | "admin"; isActive?: boolean }) =>
    apiRequest<AdminUser>("patch", `/admin/users/${id}`, data),
};
