import { apiRequest } from "./client";
import type { PublicBusinessSettings } from "@/types/settings";

export const settingsApi = {
  getPublic: () =>
    apiRequest<PublicBusinessSettings>("get", "/settings/public"),

  getAdmin: () =>
    apiRequest<{
      settings: PublicBusinessSettings;
      raw: Array<{
        key: string;
        value: unknown;
        group: string;
        description?: string;
        updatedAt?: string;
      }>;
    }>("get", "/admin/settings"),

  updateAdmin: (data: Partial<PublicBusinessSettings>) =>
    apiRequest<PublicBusinessSettings>("patch", "/admin/settings", data),
};
