import { withHandler } from "@/lib/middleware/with-handler";
import { authController } from "@/modules/auth/auth.controller";

export const GET = withHandler(
  (req) => authController.getProfile(req),
  { auth: true }
);

export const PATCH = withHandler(
  (req) => authController.updateProfile(req),
  { auth: true }
);
