import {
  DEFAULT_BUSINESS_SETTINGS,
  type PublicBusinessSettings,
} from "@/types/settings";
import { settingRepository } from "./setting.repository";

const BUSINESS_KEYS = [
  "site.name",
  "site.email",
  "site.phone",
  "site.support_email",
  "site.support_phone",
  "site.address_line",
  "site.city",
  "site.state",
  "site.pincode",
  "site.country",
  "site.hours",
  "site.whatsapp",
  "site.instagram",
  "commerce.cod_enabled",
  "shipping.free_above",
] as const;

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapDocsToBusiness(
  docs: Array<{ key: string; value: unknown }>
): PublicBusinessSettings {
  const map = new Map(docs.map((d) => [d.key, d.value]));
  const d = DEFAULT_BUSINESS_SETTINGS;
  return {
    businessName: asString(map.get("site.name"), d.businessName),
    email: asString(map.get("site.email"), d.email),
    phone: asString(map.get("site.phone"), d.phone),
    supportEmail: asString(map.get("site.support_email"), d.supportEmail),
    supportPhone: asString(map.get("site.support_phone"), d.supportPhone),
    addressLine: asString(map.get("site.address_line"), d.addressLine),
    city: asString(map.get("site.city"), d.city),
    state: asString(map.get("site.state"), d.state),
    pincode: asString(map.get("site.pincode"), d.pincode),
    country: asString(map.get("site.country"), d.country),
    hours: asString(map.get("site.hours"), d.hours),
    whatsapp: asString(map.get("site.whatsapp"), d.whatsapp),
    instagram: asString(map.get("site.instagram"), d.instagram),
    codEnabled: asBoolean(map.get("commerce.cod_enabled"), d.codEnabled),
    freeShippingAbove: asNumber(
      map.get("shipping.free_above"),
      d.freeShippingAbove
    ),
  };
}

export class SettingService {
  async getPublicBusinessSettings(): Promise<PublicBusinessSettings> {
    try {
      const docs = await settingRepository.findByKeys([...BUSINESS_KEYS]);
      if (!docs.length) return { ...DEFAULT_BUSINESS_SETTINGS };
      return mapDocsToBusiness(
        docs.map((d) => ({ key: d.key, value: d.value }))
      );
    } catch {
      return { ...DEFAULT_BUSINESS_SETTINGS };
    }
  }

  async isCodGloballyEnabled(): Promise<boolean> {
    const settings = await this.getPublicBusinessSettings();
    return settings.codEnabled;
  }

  async getAdminBusinessSettings() {
    const settings = await this.getPublicBusinessSettings();
    const docs = await settingRepository.findByKeys([...BUSINESS_KEYS]);
    return {
      settings,
      raw: docs.map((d) => ({
        key: d.key,
        value: d.value,
        group: d.group,
        description: d.description,
        updatedAt: d.updatedAt,
      })),
    };
  }

  async updateBusinessSettings(
    input: Partial<PublicBusinessSettings>
  ): Promise<PublicBusinessSettings> {
    const updates: Array<{
      key: string;
      value: unknown;
      group: string;
      description?: string;
    }> = [];

    const push = (
      key: string,
      value: unknown,
      group: string,
      description?: string
    ) => {
      if (value === undefined) return;
      updates.push({ key, value, group, description });
    };

    push("site.name", input.businessName, "business", "Public business / brand name");
    push("site.email", input.email, "business", "Primary public email");
    push("site.phone", input.phone, "business", "Primary public phone");
    push(
      "site.support_email",
      input.supportEmail,
      "business",
      "Customer support email"
    );
    push(
      "site.support_phone",
      input.supportPhone,
      "business",
      "Customer support phone"
    );
    push("site.address_line", input.addressLine, "business");
    push("site.city", input.city, "business");
    push("site.state", input.state, "business");
    push("site.pincode", input.pincode, "business");
    push("site.country", input.country, "business");
    push("site.hours", input.hours, "business");
    push("site.whatsapp", input.whatsapp, "business");
    push("site.instagram", input.instagram, "business");
    push(
      "commerce.cod_enabled",
      input.codEnabled,
      "commerce",
      "Global Cash on Delivery switch"
    );
    push(
      "shipping.free_above",
      input.freeShippingAbove,
      "commerce",
      "Free shipping cart threshold (INR)"
    );

    if (updates.length) {
      await settingRepository.upsertMany(updates);
    }

    return this.getPublicBusinessSettings();
  }
}

export const settingService = new SettingService();
