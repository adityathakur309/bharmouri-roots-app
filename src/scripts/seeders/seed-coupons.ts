import type { ClientSession } from "mongoose";
import { Coupon } from "@/lib/db/models";

const SEED_COUPONS = [
  {
    code: "HIMALAYA10",
    description: "10% off Himalayan favourites",
    discountPercent: 10,
    maxUsesPerUser: 1,
    maxTotalUses: 5,
  },
  {
    code: "BHARMOUR15",
    description: "15% off Bharmour specials",
    discountPercent: 15,
    maxUsesPerUser: 1,
    maxTotalUses: 5,
  },
  {
    code: "ORGANIC20",
    description: "20% off organic picks",
    discountPercent: 20,
    maxUsesPerUser: 1,
    maxTotalUses: 5,
  },
  {
    code: "WELCOME5",
    description: "Welcome 5% off",
    discountPercent: 5,
    maxUsesPerUser: 1,
    maxTotalUses: 5,
  },
] as const;

export interface CouponSeedResult {
  upserted: number;
}

/** Idempotent coupon seed — never overwrites usage counts on existing codes. */
export async function seedCoupons(session?: ClientSession): Promise<CouponSeedResult> {
  let upserted = 0;

  for (const c of SEED_COUPONS) {
    await Coupon.findOneAndUpdate(
      { code: c.code },
      {
        $set: {
          description: c.description,
          discountPercent: c.discountPercent,
          isActive: true,
          maxUsesPerUser: c.maxUsesPerUser,
          maxTotalUses: c.maxTotalUses,
        },
        $setOnInsert: {
          code: c.code,
          usedCount: 0,
          expiresAt: null,
        },
      },
      { upsert: true, ...(session ? { session } : {}) }
    );
    upserted += 1;
  }

  return { upserted };
}
