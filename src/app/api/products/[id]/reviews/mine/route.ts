import { withHandler } from "@/lib/middleware/with-handler";
import { reviewController } from "@/modules/review/review.controller";

export const GET = withHandler(
  (req, ctx) => reviewController.mine(req, ctx!),
  { auth: true }
);
