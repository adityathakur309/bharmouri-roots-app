import type { ClientSession } from "mongoose";
import { User } from "@/lib/db/models";
import { hashPassword } from "@/lib/utils/auth-helper";
import { SEED_DEMO_USERS } from "./data/demo-users.data";

export interface DemoUsersSeedResult {
  created: number;
  existing: number;
}

/**
 * Seed lightweight demo customers used as review authors.
 * Does not create carts, orders, addresses, or wishlists.
 */
export async function seedDemoUsers(session?: ClientSession): Promise<DemoUsersSeedResult> {
  const password =
    process.env.DEMO_SEED_PASSWORD?.trim() || "Customer@12345";

  if (password.length < 8) {
    throw new Error("DEMO_SEED_PASSWORD must be at least 8 characters");
  }

  const hashed = await hashPassword(password);
  let created = 0;
  let existing = 0;

  for (const demo of SEED_DEMO_USERS) {
    const email = demo.email.toLowerCase();
    const query = User.findOne({ email });
    if (session) query.session(session);
    const found = await query;

    if (found) {
      existing += 1;
      continue;
    }

    const doc = {
      name: demo.name,
      email,
      password: hashed,
      role: "user" as const,
      avatar: demo.avatar,
      isActive: true,
      emailVerified: new Date(),
    };

    if (session) {
      await User.create([doc], { session });
    } else {
      await User.create(doc);
    }
    created += 1;
  }

  console.log(
    `[seed:demo-users] Password for new demo accounts: ${password} (set DEMO_SEED_PASSWORD to override)`
  );

  return { created, existing };
}
