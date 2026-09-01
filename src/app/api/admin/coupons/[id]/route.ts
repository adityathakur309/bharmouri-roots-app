import { withHandler } from "@/lib/middleware/with-handler";
import { couponController } from "@/modules/coupon/coupon.controller";

export const GET = withHandler(
  (req, ctx) => couponController.getById(req, ctx!),
  { admin: true }
);
export const PATCH = withHandler(
  (req, ctx) => couponController.update(req, ctx!),
  { admin: true }
);
export const DELETE = withHandler(
  (req, ctx) => couponController.remove(req, ctx!),
  { admin: true }
);
