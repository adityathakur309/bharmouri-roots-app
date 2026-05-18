import { withHandler } from "@/lib/middleware/with-handler";
import { productController } from "@/modules/product/product.controller";

export const GET = withHandler((req) => productController.listAdmin(req), { admin: true });
export const POST = withHandler((req) => productController.create(req), { admin: true });
