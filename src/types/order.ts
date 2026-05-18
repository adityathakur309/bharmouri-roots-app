export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "razorpay" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingInfo {
  courierName?: string;
  awbCode?: string;
  trackingId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  estimatedDelivery?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
}
