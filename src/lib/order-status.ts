import { Package, RotateCcw, Truck, Clock, CheckCircle, XCircle } from "lucide-react";

export const orderStatusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Package }
> = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    icon: Clock,
  },
  payment_pending: {
    label: "Payment Pending",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    icon: Clock,
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    icon: CheckCircle,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    icon: Package,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    icon: RotateCcw,
  },
  shipped: {
    label: "Shipped",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    icon: XCircle,
  },
};
