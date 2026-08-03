import type { ClientSession } from "mongoose";
import { User } from "@/lib/db/models";
import { hashPassword } from "@/lib/utils/auth-helper";

export interface AdminSeedResult {
  status: "created" | "exists" | "skipped_missing_env";
  email?: string;
}

/**
 * Create default admin only when ADMIN_EMAIL + ADMIN_PASSWORD are set.
 * Skips if that email already exists. Never duplicates. Never overwrites password.
 */
export async function seedAdmin(session?: ClientSession): Promise<AdminSeedResult> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    console.warn(
      "[seed:admin] Skipped — set ADMIN_EMAIL and ADMIN_PASSWORD (optional ADMIN_NAME) to create an admin."
    );
    return { status: "skipped_missing_env" };
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const query = User.findOne({ email });
  if (session) query.session(session);
  const existing = await query;

  if (existing) {
    if (existing.role !== "admin" || !existing.isActive || !existing.emailVerified) {
      existing.role = "admin";
      existing.isActive = true;
      if (!existing.emailVerified) existing.emailVerified = new Date();
      await existing.save(session ? { session } : undefined);
      console.log(`[seed:admin] Ensured admin flags on existing user: ${email}`);
    } else {
      console.log(`[seed:admin] Admin already exists: ${email}`);
    }
    return { status: "exists", email };
  }

  const hashed = await hashPassword(password);
  if (session) {
    await User.create(
      [
        {
          name,
          email,
          password: hashed,
          role: "admin",
          isActive: true,
          emailVerified: new Date(),
        },
      ],
      { session }
    );
  } else {
    await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
      isActive: true,
      emailVerified: new Date(),
    });
  }

  console.log(`[seed:admin] Created admin: ${email}`);
  return { status: "created", email };
}
