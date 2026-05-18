/**
 * Seed database with products and default admin user.
 * Run: npm run seed
 */
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { products } from "../lib/mock-data";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const { User, Product } = await import("../lib/db/models");

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@bharmouriroots.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log("Admin already exists");
  }

  for (const p of products) {
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        category: p.category,
        categorySlug: p.categorySlug,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        rating: p.rating,
        reviews: p.reviews,
        stock: p.stock,
        images: p.images,
        description: p.description,
        shortDescription: p.shortDescription,
        features: p.features,
        weight: p.weight,
        origin: p.origin,
        badge: p.badge,
        isFeatured: p.isFeatured ?? false,
        isNewProduct: p.isNew ?? false,
        isBestseller: p.isBestseller ?? false,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
