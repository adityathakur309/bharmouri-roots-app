import { withHandler } from "@/lib/middleware/with-handler";
import { orderController } from "@/modules/order/order.controller";

export const GET = withHandler((req) => orderController.listAll(req), { admin: true });
