import { apiRequest, apiClient } from "./client";
import type { Category } from "@/types/category";

export const categoryApi = {
  list: () => apiRequest<Category[]>("get", "/categories"),

  adminList: () => apiRequest<Category[]>("get", "/admin/categories"),

  uploadIcon: (file: File) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return apiClient.post<{ success: true; data: { url: string } }>(
      "/admin/upload?purpose=category",
      formData
    );
  },

  create: (data: Record<string, unknown>) =>
    apiRequest<Category>("post", "/admin/categories", data),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<Category>("patch", `/admin/categories/${id}`, data),

  remove: (id: string) =>
    apiRequest<Category>("delete", `/admin/categories/${id}`),

  removeAll: () =>
    apiRequest<{ deactivated: number }>("delete", "/admin/categories"),
};
