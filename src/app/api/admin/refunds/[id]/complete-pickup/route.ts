import { withHandler } from "@/lib/middleware/with-handler";
import { refundController } from "@/modules/refund/refund.controller";

export const POST = withHandler(
  (req, ctx) => refundController.completePickup(req, ctx!),
  { admin: true }
);
