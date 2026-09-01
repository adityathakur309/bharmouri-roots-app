import type { OrderStatus } from "@/types/order";

export type AdminOrderQueue =
  | "all"
  | "review"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ADMIN_ORDER_QUEUES: Array<{
  id: AdminOrderQueue;
  label: string;
  description: string;
}> = [
  { id: "all", label: "All", description: "Every order" },
  {
    id: "review",
    label: "Review",
    description: "New orders awaiting payment check or confirmation",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    description: "Approved — ready to pack or create shipment",
  },
  {
    id: "processing",
    label: "Processing",
    description: "Packed / shipment booked",
  },
  { id: "shipped", label: "Shipped", description: "Out for delivery" },
  { id: "delivered", label: "Delivered", description: "Completed orders" },
  { id: "cancelled", label: "Cancelled", description: "Cancelled orders" },
];

/** Map admin queue tabs to underlying order statuses. */
export const ADMIN_ORDER_QUEUE_STATUSES: Record<
  Exclude<AdminOrderQueue, "all">,
  OrderStatus[]
> = {
  review: ["pending", "payment_pending", "paid"],
  confirmed: ["confirmed"],
  processing: ["processing"],
  shipped: ["shipped"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

export function queueForStatus(status: OrderStatus): AdminOrderQueue {
  if (status === "pending" || status === "payment_pending" || status === "paid") {
    return "review";
  }
  if (status === "confirmed") return "confirmed";
  if (status === "processing") return "processing";
  if (status === "shipped") return "shipped";
  if (status === "delivered") return "delivered";
  return "cancelled";
}
