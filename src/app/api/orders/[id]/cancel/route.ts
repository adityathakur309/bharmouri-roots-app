import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { orderController } from "@/modules/order/order.controller";

export const POST = withHandler(
  (req, ctx) => orderController.cancelMine(req, ctx!),
  { auth: true, rateLimit: RATE_LIMITS.default }
);
