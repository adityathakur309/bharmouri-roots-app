import { apiRequest } from "./client";

export const orderApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiRequest("get", "/orders", undefined, params as Record<string, unknown>),

  getById: (id: string) => apiRequest("get", `/orders/${id}`),

  create: (data: {
    paymentMethod: "razorpay" | "cod";
    shippingAddress?: Record<string, string>;
    addressId?: string;
    couponCode?: string;
  }) => apiRequest("post", "/orders", data),

  createRazorpayOrder: (orderId: string) =>
    apiRequest<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      orderId: string;
      orderNumber: string;
      isMock?: boolean;
    }>("post", "/payments/razorpay/create-order", { orderId }),

  verifyPayment: (data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    mockOutcome?: "success" | "failed" | "pending";
  }) => apiRequest("post", "/payments/razorpay/verify", data),

  getTracking: (id: string) => apiRequest("get", `/orders/${id}/tracking`),

  adminList: (params?: Record<string, unknown>) =>
    apiRequest("get", "/admin/orders", undefined, params),

  updateStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    apiRequest("patch", `/orders/${id}/status`, data),

  createShipment: (id: string) =>
    apiRequest("post", `/orders/${id}/shipment`),
};
