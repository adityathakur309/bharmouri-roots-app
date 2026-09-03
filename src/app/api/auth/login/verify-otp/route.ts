import { withHandler } from "@/lib/middleware/with-handler";
import { authController } from "@/modules/auth/auth.controller";

export const POST = withHandler((req) => authController.verifyLoginOtp(req), {
  rateLimit: { maxRequests: 20, windowMs: 60_000 },
});
