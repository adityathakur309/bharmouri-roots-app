import { withHandler } from "@/lib/middleware/with-handler";
import { cartController } from "@/modules/cart/cart.controller";

export const POST = withHandler((req) => cartController.applyCoupon(req), { auth: true });
export const DELETE = withHandler((req) => cartController.removeCoupon(req), { auth: true });
