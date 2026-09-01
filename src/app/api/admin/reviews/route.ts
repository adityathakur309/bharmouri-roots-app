import { withHandler } from "@/lib/middleware/with-handler";
import { reviewController } from "@/modules/review/review.controller";

export const GET = withHandler((req) => reviewController.listAdmin(req), {
  admin: true,
});
