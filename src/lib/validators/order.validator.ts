import { z } from "zod";

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
  status: z.enum([
    "pending",
    "payment_pending",
    "paid",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  adminNotes: z.string().optional(),
});

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
