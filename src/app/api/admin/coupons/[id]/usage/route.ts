import { withHandler } from "@/lib/middleware/with-handler";
import { couponController } from "@/modules/coupon/coupon.controller";

export const GET = withHandler(
  (req, ctx) => couponController.usage(req, ctx!),
  { admin: true }
);
