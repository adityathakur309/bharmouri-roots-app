import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { authController } from "@/modules/auth/auth.controller";

/** Step 2 — complete registration after email link */
export const POST = withHandler((req) => authController.completeRegistration(req), {
  rateLimit: RATE_LIMITS.auth,
});
