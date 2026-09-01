import { withHandler } from "@/lib/middleware/with-handler";
import { couponController } from "@/modules/coupon/coupon.controller";

export const GET = withHandler((req) => couponController.list(req), { admin: true });
export const POST = withHandler((req) => couponController.create(req), { admin: true });
