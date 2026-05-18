import { withHandler } from "@/lib/middleware/with-handler";
import { productController } from "@/modules/product/product.controller";

export const PATCH = withHandler(
  (req, ctx) => productController.update(req, ctx!),
  { admin: true }
);

export const DELETE = withHandler(
  (req, ctx) => productController.remove(req, ctx!),
  { admin: true }
);
