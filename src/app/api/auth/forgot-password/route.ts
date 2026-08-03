import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { authController } from "@/modules/auth/auth.controller";

export const POST = withHandler((req) => authController.forgotPassword(req), {
  rateLimit: RATE_LIMITS.auth,
});
