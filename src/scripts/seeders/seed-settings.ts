import type { ClientSession } from "mongoose";
import { Setting } from "@/lib/db/models";
import { getSeedSettings } from "./data/settings.data";

export interface SettingsSeedResult {
  upserted: number;
  skippedExistingCustom: number;
}

/**
 * Insert missing settings only (never overwrite existing DB values).
 * Keeps operator customizations safe across re-seeds.
 */
export async function seedSettings(session?: ClientSession): Promise<SettingsSeedResult> {
  let upserted = 0;
  let skippedExistingCustom = 0;

  for (const item of getSeedSettings()) {
    const query = Setting.findOne({ key: item.key });
    if (session) query.session(session);
    const existing = await query;

    if (existing) {
      skippedExistingCustom += 1;
      continue;
    }

    if (session) {
      await Setting.create(
        [
          {
            key: item.key,
            value: item.value,
            group: item.group,
            description: item.description,
          },
        ],
        { session }
      );
    } else {
      await Setting.create({
        key: item.key,
        value: item.value,
        group: item.group,
        description: item.description,
      });
    }
    upserted += 1;
  }

  return { upserted, skippedExistingCustom };
}
