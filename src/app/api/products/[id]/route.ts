import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { productController } from "@/modules/product/product.controller";

export const GET = withHandler((req, ctx) => productController.getById(req, ctx!), {
  rateLimit: RATE_LIMITS.public,
});
