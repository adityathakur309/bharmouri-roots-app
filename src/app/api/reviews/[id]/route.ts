import { withHandler } from "@/lib/middleware/with-handler";
import { reviewController } from "@/modules/review/review.controller";

export const PATCH = withHandler(
  (req, ctx) => reviewController.update(req, ctx!),
  { auth: true }
);

export const DELETE = withHandler(
  (req, ctx) => reviewController.remove(req, ctx!),
  { auth: true }
);
