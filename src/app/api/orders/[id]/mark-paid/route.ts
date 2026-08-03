import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

/** Admin: mark COD order payment as collected */
export const POST = withHandler(
  (req, ctx) => orderController.markCodPaid(req, ctx!),
  { admin: true }
);
