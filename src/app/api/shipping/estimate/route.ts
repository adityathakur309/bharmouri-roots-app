import { withHandler } from "@/lib/middleware/with-handler";
import { shippingController } from "@/modules/shipping/shipping.controller";

export const GET = withHandler((req) => shippingController.estimate(req));
