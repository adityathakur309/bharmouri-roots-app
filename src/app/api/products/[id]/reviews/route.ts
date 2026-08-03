import { withHandler } from "@/lib/middleware/with-handler";
import { RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { reviewController } from "@/modules/review/review.controller";

export const GET = withHandler(
  (req, ctx) => reviewController.list(req, ctx!),
  { rateLimit: RATE_LIMITS.public }
);

export const POST = withHandler(
  (req, ctx) => reviewController.create(req, ctx!),
  { auth: true }
);
