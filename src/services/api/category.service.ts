import { apiRequest } from "./client";
import type { Category } from "@/types/category";

export const categoryApi = {
  list: () => apiRequest<Category[]>("get", "/categories"),
};
