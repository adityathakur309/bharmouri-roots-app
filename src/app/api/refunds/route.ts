import { withHandler } from "@/lib/middleware/with-handler";
import { refundController } from "@/modules/refund/refund.controller";

export const GET = withHandler((req) => refundController.listMine(req), {
  auth: true,
});
export const POST = withHandler((req) => refundController.create(req), {
  auth: true,
});
