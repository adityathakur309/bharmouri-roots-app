import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { productController } from "@/modules/product/product.controller";

export const GET = withHandler((req) => productController.list(req), {
  rateLimit: RATE_LIMITS.public,
});
