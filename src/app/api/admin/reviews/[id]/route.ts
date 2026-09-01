import { withHandler } from "@/lib/middleware/with-handler";
import { reviewController } from "@/modules/review/review.controller";

export const PATCH = withHandler(
  (req, ctx) => reviewController.moderate(req, ctx!),
  { admin: true }
);
