import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

export const POST = withHandler(
  (req) => orderController.createRazorpayOrder(req),
  { auth: true }
);
