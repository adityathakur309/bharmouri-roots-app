import { withHandler } from "@/lib/middleware/with-handler";
import { authController } from "@/modules/auth/auth.controller";

export const POST = withHandler(() => authController.logout());
