import { withHandler } from "@/lib/middleware/with-handler";
import { settingController } from "@/modules/settings/setting.controller";

export const GET = withHandler((req) => settingController.getAdmin(req), {
  admin: true,
});

export const PATCH = withHandler((req) => settingController.updateAdmin(req), {
  admin: true,
});
