import { apiRequest } from "./client";
import type { Category } from "@/types/category";

export const categoryApi = {
  list: () => apiRequest<Category[]>("get", "/categories"),

  adminList: () => apiRequest<Category[]>("get", "/admin/categories"),

  create: (data: Record<string, unknown>) =>
    apiRequest<Category>("post", "/admin/categories", data),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<Category>("patch", `/admin/categories/${id}`, data),

  remove: (id: string) =>
    apiRequest<Category>("delete", `/admin/categories/${id}`),

  removeAll: () =>
    apiRequest<{ deactivated: number }>("delete", "/admin/categories"),
};
