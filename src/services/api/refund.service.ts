import { apiRequest } from "./client";

export type RefundStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "quality_check"
  | "pickup_scheduled"
  | "pickup_completed"
  | "refund_processing"
  | "refunded"
  | "failed";

export interface RefundRequestItem {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customer?: { name?: string; email?: string; phone?: string };
  productName: string;
  productImage?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  reason: string;
  customerNotes?: string;
  status: RefundStatus;
  statusLabel: string;
  rejectionReason?: string;
  adminNotes?: string;
  qualityCheck?: {
    condition?: string;
    passed?: boolean;
    notes?: string;
    evidenceImages?: string[];
  };
  pickup?: {
    scheduledAt?: string;
    scheduledSlot?: string;
    courierName?: string;
    pickupId?: string;
    awbCode?: string;
    trackingId?: string;
    provider?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    completedAt?: string;
  };
  skipPickup?: boolean;
  razorpayRefundId?: string;
  refundAmountPaise?: number;
  refundFailureReason?: string;
  timeline?: Array<{
    status: RefundStatus;
    label: string;
    note?: string;
    date: string;
    at?: string;
  }>;
  date: string;
  createdAt?: string;
}

export const refundApi = {
  create: (data: {
    orderId: string;
    itemIndex: number;
    quantity: number;
    reason: string;
    customerNotes?: string;
    evidenceImages?: string[];
  }) => apiRequest<RefundRequestItem>("post", "/refunds", data),

  listMine: (params?: Record<string, unknown>) =>
    apiRequest<RefundRequestItem[]>("get", "/refunds", undefined, params),

  getMine: (id: string) => apiRequest<RefundRequestItem>("get", `/refunds/${id}`),

  adminList: (params?: Record<string, unknown>) =>
    apiRequest<RefundRequestItem[]>("get", "/admin/refunds", undefined, params),

  adminGet: (id: string) =>
    apiRequest<RefundRequestItem>("get", `/admin/refunds/${id}`),

  review: (
    id: string,
    data: {
      action: "start_review" | "approve" | "reject";
      rejectionReason?: string;
      adminNotes?: string;
      skipPickup?: boolean;
    }
  ) => apiRequest<RefundRequestItem>("post", `/admin/refunds/${id}/review`, data),

  qualityCheck: (
    id: string,
    data: {
      passed: boolean;
      condition?: string;
      notes?: string;
      evidenceImages?: string[];
      rejectionReason?: string;
    }
  ) =>
    apiRequest<RefundRequestItem>("post", `/admin/refunds/${id}/quality-check`, data),

  schedulePickup: (id: string, data?: Record<string, unknown>) =>
    apiRequest<RefundRequestItem>("post", `/admin/refunds/${id}/schedule-pickup`, data ?? {}),

  completePickup: (id: string, data?: { notes?: string }) =>
    apiRequest<RefundRequestItem>("post", `/admin/refunds/${id}/complete-pickup`, data ?? {}),

  initiate: (id: string, data?: { amountInr?: number; reason?: string }) =>
    apiRequest<RefundRequestItem>("post", `/admin/refunds/${id}/initiate`, data ?? {}),
};
