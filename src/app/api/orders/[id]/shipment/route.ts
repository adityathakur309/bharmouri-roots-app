import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

export const POST = withHandler(
  (req, ctx) => orderController.createShipment(req, ctx!),
  { admin: true }
);
