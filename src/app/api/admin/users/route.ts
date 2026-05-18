import { withHandler } from "@/lib/middleware/with-handler";
import { userController } from "@/modules/user/user.controller";

export const GET = withHandler((req) => userController.list(req), { admin: true });
