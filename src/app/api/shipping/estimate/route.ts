import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { shippingController } from "@/modules/shipping/shipping.controller";

export const GET = withHandler((req) => shippingController.estimate(req), {
  rateLimit: RATE_LIMITS.public,
});
