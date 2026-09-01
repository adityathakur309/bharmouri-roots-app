import { withHandler } from "@/lib/middleware/with-handler";
import { authController } from "@/modules/auth/auth.controller";

export const GET = withHandler((req) => authController.oauthSession(req), {
  rateLimit: { maxRequests: 30, windowMs: 60_000 },
});
