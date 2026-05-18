import { apiRequest } from "./client";

export const wishlistApi = {
  get: () => apiRequest("get", "/wishlist"),
  toggle: (productId: string) =>
    apiRequest<{ added: boolean; productIds: string[] }>("post", "/wishlist", {
      productId,
    }),
};
