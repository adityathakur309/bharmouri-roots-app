import { withHandler } from "@/lib/middleware/with-handler";
import { settingController } from "@/modules/settings/setting.controller";

export const GET = withHandler(() => settingController.getPublic(), {
  rateLimit: { maxRequests: 60, windowMs: 60_000 },
});
