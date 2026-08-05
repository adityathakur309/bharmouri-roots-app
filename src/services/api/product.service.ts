import { apiRequest, apiClient } from "./client";
import type { Product } from "@/types/product";

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const productApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    featured?: boolean;
    sort?: string;
  }) =>
    apiRequest<Product[]>("get", "/products", undefined, params as Record<string, unknown>),

  getById: (idOrSlug: string) => apiRequest<Product>("get", `/products/${idOrSlug}`),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return apiClient.post<{ success: true; data: { url: string } }>(
      "/admin/upload?purpose=product",
      formData
    );
  },

  adminList: (params?: Record<string, unknown>) =>
    apiRequest<Product[]>("get", "/admin/products", undefined, params),

  create: (data: Record<string, unknown>) =>
    apiRequest<Product>("post", "/admin/products", data),

  update: (id: string, data: Record<string, unknown>) =>
    apiRequest<Product>("patch", `/admin/products/${id}`, data),

  remove: (id: string) => apiRequest<Product>("delete", `/admin/products/${id}`),
};
