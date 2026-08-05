import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { categoryController } from "@/modules/category/category.controller";

/** Public top-level categories with live product counts. */
export const GET = withHandler((req) => categoryController.list(req), {
  rateLimit: RATE_LIMITS.public,
});
