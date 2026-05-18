import { apiRequest } from "./client";

export const addressApi = {
  list: () => apiRequest("get", "/addresses"),
  create: (data: Record<string, unknown>) => apiRequest("post", "/addresses", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiRequest("patch", `/addresses/${id}`, data),
  remove: (id: string) => apiRequest("delete", `/addresses/${id}`),
};
