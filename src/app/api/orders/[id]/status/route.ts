import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

export const PATCH = withHandler(
  (req, ctx) => orderController.updateStatus(req, ctx!),
  { admin: true }
);
