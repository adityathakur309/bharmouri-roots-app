import { withHandler } from "@/lib/middleware/with-handler";
import { userController } from "@/modules/user/user.controller";

export const GET = withHandler(
  (req, ctx) => userController.getById(req, ctx!),
  { admin: true }
);

export const PATCH = withHandler(
  (req, ctx) => userController.update(req, ctx!),
  { admin: true }
);
