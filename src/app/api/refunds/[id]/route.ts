import { withHandler } from "@/lib/middleware/with-handler";
import { refundController } from "@/modules/refund/refund.controller";

export const GET = withHandler(
  (req, ctx) => refundController.getMine(req, ctx!),
  { auth: true }
);
