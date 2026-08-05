import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { authController } from "@/modules/auth/auth.controller";

/** Step 1 — send registration verification email */
export const POST = withHandler((req) => authController.startRegistration(req), {
  rateLimit: RATE_LIMITS.auth,
});
