import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

export const GET = withHandler((req) => orderController.listMine(req), { auth: true });
export const POST = withHandler((req) => orderController.create(req), { auth: true });
