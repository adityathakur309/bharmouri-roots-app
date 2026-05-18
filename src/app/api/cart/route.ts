import { withHandler } from "@/lib/middleware/with-handler";
import { cartController } from "@/modules/cart/cart.controller";

export const GET = withHandler((req) => cartController.get(req), { auth: true });
export const DELETE = withHandler((req) => cartController.clear(req), { auth: true });
