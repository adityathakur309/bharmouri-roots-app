import { apiRequest } from "./client";

export const cartApi = {
  get: () => apiRequest("get", "/cart"),
  addItem: (productId: string, quantity = 1, variantId?: string) =>
    apiRequest("post", "/cart/items", {
      productId,
      quantity,
      ...(variantId ? { variantId } : {}),
    }),
  updateItem: (productId: string, quantity: number, variantId?: string | null) =>
    apiRequest("patch", "/cart/items", {
      productId,
      quantity,
      ...(variantId !== undefined ? { variantId } : {}),
    }),
  clear: () => apiRequest("delete", "/cart"),
  applyCoupon: (code: string) => apiRequest("post", "/cart/coupon", { code }),
  removeCoupon: () => apiRequest("delete", "/cart/coupon"),
};
