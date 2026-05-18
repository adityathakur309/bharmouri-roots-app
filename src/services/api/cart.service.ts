import { apiRequest } from "./client";

export const cartApi = {
  get: () => apiRequest("get", "/cart"),
  addItem: (productId: string, quantity = 1) =>
    apiRequest("post", "/cart/items", { productId, quantity }),
  updateItem: (productId: string, quantity: number) =>
    apiRequest("patch", "/cart/items", { productId, quantity }),
  clear: () => apiRequest("delete", "/cart"),
  applyCoupon: (code: string) => apiRequest("post", "/cart/coupon", { code }),
  removeCoupon: () => apiRequest("delete", "/cart/coupon"),
};
