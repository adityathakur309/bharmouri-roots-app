import { withHandler } from "@/lib/middleware/with-handler";
import { authController } from "@/modules/auth/auth.controller";

export const GET = withHandler(() => authController.getProviders(), {
  rateLimit: { maxRequests: 60, windowMs: 60_000 },
});
