import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

export const GET = withHandler(
  (req, ctx) => orderController.getTracking(req, ctx!),
  { auth: true }
);
