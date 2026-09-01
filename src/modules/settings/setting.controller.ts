import { successResponse } from "@/lib/utils/api-response";
import { updateBusinessSettingsSchema } from "@/lib/validators/settings.validator";
import type { AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { settingService } from "./setting.service";

export class SettingController {
  async getPublic() {
    const settings = await settingService.getPublicBusinessSettings();
    return successResponse(settings);
  }

  async getAdmin(_request: AuthenticatedRequest) {
    const data = await settingService.getAdminBusinessSettings();
    return successResponse(data);
  }

  async updateAdmin(request: AuthenticatedRequest) {
    const body = await request.json();
    const input = updateBusinessSettingsSchema.parse(body);
    const settings = await settingService.updateBusinessSettings(input);
    return successResponse(settings, { message: "Settings updated" });
  }
}

export const settingController = new SettingController();
