import { withHandler } from "@/lib/middleware/with-handler";
import { cartController } from "@/modules/cart/cart.controller";

export const POST = withHandler((req) => cartController.addItem(req), { auth: true });
export const PATCH = withHandler((req) => cartController.updateItem(req), { auth: true });
