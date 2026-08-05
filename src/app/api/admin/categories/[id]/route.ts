import { withHandler } from "@/lib/middleware/with-handler";
import { categoryController } from "@/modules/category/category.controller";

export const PATCH = withHandler(
  (req, ctx) => categoryController.update(req, ctx!),
  { admin: true }
);

export const DELETE = withHandler(
  (req, ctx) => categoryController.remove(req, ctx!),
  { admin: true }
);
