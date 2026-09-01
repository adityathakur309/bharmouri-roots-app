import { z } from "zod";
import { paginationSchema } from "@/lib/utils/query";

const orderStatusEnum = z.enum([
  "pending",
  "payment_pending",
  "paid",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

const adminOrderQueueEnum = z.enum([
  "all",
  "review",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

const addressInputSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  addressId: z.string().optional(),
});

export const createOrderSchema = z.object({
  paymentMethod: z.enum(["razorpay", "cod"]),
  shippingAddress: addressInputSchema.optional(),
  addressId: z.string().optional(),
  couponCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
  adminNotes: z.string().optional(),
});

export const orderListQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: orderStatusEnum.optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(["newest", "oldest"]).optional(),
});

export const adminOrderListQuerySchema = orderListQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  queue: adminOrderQueueEnum.optional(),
});

export type OrderListQueryInput = z.infer<typeof orderListQuerySchema>;
export type AdminOrderListQueryInput = z.infer<typeof adminOrderListQuerySchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  mockOutcome: z.enum(["success", "failed", "pending"]).optional(),
});

export const createRazorpayOrderSchema = z.object({
  orderId: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
