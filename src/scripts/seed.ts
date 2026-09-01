/**
 * Professional idempotent database seeder.
 * Run: npm run seed
 *
 * Seeds: categories, settings, admin, curated products, demo reviewers, reviews.
 * Does NOT seed carts, orders, wishlists, or addresses.
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import mongoose from "mongoose";
import { Category, Setting, User, Product, Review, Coupon } from "@/lib/db/models";
import { seedAdmin } from "./seeders/seed-admin";
import { seedCategories } from "./seeders/seed-categories";
import { seedProducts } from "./seeders/seed-products";
import { seedSettings } from "./seeders/seed-settings";
import { seedDemoUsers } from "./seeders/seed-demo-users";
import { seedReviews } from "./seeders/seed-reviews";
import { seedCoupons } from "./seeders/seed-coupons";
import { SEED_PRODUCTS } from "./seeders/data/products.data";
function log(section: string, message: string) {
  console.log(`[seed:${section}] ${message}`);
}

async function verify() {
  const topCategories = await Category.countDocuments({ parent: null });
  const subcategories = await Category.countDocuments({ parent: { $ne: null } });
  const settings = await Setting.countDocuments();
  const admins = await User.countDocuments({ role: "admin", isActive: true });
  const demoUsers = await User.countDocuments({
    email: { $regex: /\.demo@bharmouriroots\.com$/i },
  });
  const activeProducts = await Product.countDocuments({ isActive: true });
  const seedProductsActive = await Product.countDocuments({
    slug: { $in: SEED_PRODUCTS.map((p) => p.slug) },
    isActive: true,
  });
  const reviews = await Review.countDocuments({ isActive: true, status: "approved" });
  const coupons = await Coupon.countDocuments({ isActive: true });
  const rolesSetting = await Setting.findOne({ key: "rbac.roles" }).lean();
  const permissionsSetting = await Setting.findOne({ key: "rbac.permissions" }).lean();

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
  console.log(`Demo reviewer users  : ${demoUsers}`);
  console.log(`Active products      : ${activeProducts}`);
  console.log(`Curated seed products: ${seedProductsActive}/${SEED_PRODUCTS.length}`);
  console.log(`Active reviews       : ${reviews}`);
  console.log(`Active coupons       : ${coupons}`);
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
  if (admins < 1) {
    throw new Error(
      "Verification failed: no admin user. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env"
    );
  }
  if (seedProductsActive < SEED_PRODUCTS.length) {
    throw new Error("Verification failed: curated seed products missing");
  }
  if (reviews < 1) {
    throw new Error("Verification failed: expected seeded reviews");
  }
  if (coupons < 1) {
    throw new Error("Verification failed: expected seeded coupons");
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
    const cats = await seedCategories();
    log(
      "categories",
      `Upserted ${cats.categoriesUpserted} categories, ${cats.subcategoriesUpserted} subcategories; deactivated ${cats.deactivatedLegacy} legacy`
    );

    const settings = await seedSettings();
    log(
      "settings",
      `Inserted ${settings.upserted} missing setting(s); left ${settings.skippedExistingCustom} existing unchanged`
    );

    const admin = await seedAdmin();
    log("admin", `Status: ${admin.status}${admin.email ? ` (${admin.email})` : ""}`);
    if (admin.status === "skipped_missing_env") {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seeding");
    }

    const demoUsers = await seedDemoUsers();
    log("demo-users", `Created ${demoUsers.created}, already existed ${demoUsers.existing}`);

    const productResult = await seedProducts();
    log(
      "products",
      `Upserted ${productResult.upserted} curated product(s); deactivated ${productResult.deactivatedLegacy} legacy; purged ${productResult.purgedInactive} inactive`
    );

    const reviewResult = await seedReviews();
    log(
      "reviews",
      `Created ${reviewResult.created}, existing ${reviewResult.existing}; synced ${reviewResult.productsSynced} product rating(s)`
    );

    const couponResult = await seedCoupons();
    log("coupons", `Upserted ${couponResult.upserted} coupon(s)`);

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
