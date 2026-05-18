import { withHandler } from "@/lib/middleware/with-handler";
import { productController } from "@/modules/product/product.controller";

export const GET = withHandler((req, ctx) => productController.getById(req, ctx!));
