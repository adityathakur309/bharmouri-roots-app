/**
 * Professional idempotent database seeder.
 * Run: npm run seed
 *
 * Safe to run multiple times — uses unique keys (slug/email/setting key) + upsert / insert-if-missing.
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import mongoose from "mongoose";
import { Category, Setting, User, Product } from "@/lib/db/models";
import { seedAdmin } from "./seeders/seed-admin";
import { seedCategories } from "./seeders/seed-categories";
import { seedProducts } from "./seeders/seed-products";
import { seedSettings } from "./seeders/seed-settings";

function log(section: string, message: string) {
  console.log(`[seed:${section}] ${message}`);
}

async function verify() {
  const topCategories = await Category.countDocuments({ parent: null });
  const subcategories = await Category.countDocuments({ parent: { $ne: null } });
  const settings = await Setting.countDocuments();
  const admins = await User.countDocuments({ role: "admin", isActive: true });
  const products = await Product.countDocuments();
  const rolesSetting = await Setting.findOne({ key: "rbac.roles" }).lean();
  const permissionsSetting = await Setting.findOne({ key: "rbac.permissions" }).lean();

  // Sanity: every subcategory has a valid parent Category
  const orphans = await Category.aggregate([
    { $match: { parent: { $ne: null } } },
    {
      $lookup: {
        from: "categories",
        localField: "parent",
        foreignField: "_id",
        as: "parentDoc",
      },
    },
    { $match: { parentDoc: { $size: 0 } } },
    { $count: "count" },
  ]);
  const orphanCount = orphans[0]?.count ?? 0;

  console.log("\n========== SEED VERIFICATION ==========");
  console.log(`Top-level categories : ${topCategories}`);
  console.log(`Subcategories        : ${subcategories}`);
  console.log(`Orphan subcategories : ${orphanCount}`);
  console.log(`Settings             : ${settings}`);
  console.log(`Active admins        : ${admins}`);
  console.log(`Products             : ${products}`);
  console.log(`Roles catalog        : ${rolesSetting ? "yes" : "MISSING"}`);
  console.log(`Permissions catalog  : ${permissionsSetting ? "yes" : "MISSING"}`);
  console.log("=======================================\n");

  if (orphanCount > 0) {
    throw new Error(`Verification failed: ${orphanCount} subcategory record(s) have invalid parent refs`);
  }
  if (topCategories < 1 || subcategories < 1) {
    throw new Error("Verification failed: expected categories and subcategories");
  }
  if (!rolesSetting || !permissionsSetting) {
    throw new Error("Verification failed: RBAC role/permission settings missing");
  }
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[seed] MONGODB_URI is required");
    process.exit(1);
  }

  console.log("[seed] Connecting…");
  await mongoose.connect(uri);
  console.log("[seed] Connected");

  try {
    // Sequential atomic upserts (safe on Atlas when collections are created mid-seed).
    // Multi-doc transactions are avoided here because creating new collections inside
    // a transaction can fail with "namespace already in use" on first run.
    const cats = await seedCategories();
    log("categories", `Upserted ${cats.categoriesUpserted} categories, ${cats.subcategoriesUpserted} subcategories`);

    const settings = await seedSettings();
    log(
      "settings",
      `Inserted ${settings.upserted} missing setting(s); left ${settings.skippedExistingCustom} existing unchanged`
    );

    const admin = await seedAdmin();
    log("admin", `Status: ${admin.status}${admin.email ? ` (${admin.email})` : ""}`);

    const productResult = await seedProducts();
    log("products", `Upserted ${productResult.upserted} product(s) by slug`);

    await verify();
    console.log("[seed] Completed successfully (idempotent — safe to re-run).");
  } catch (err) {
    console.error("[seed] Failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("[seed] Disconnected");
  }
}

seed();
