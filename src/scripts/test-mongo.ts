import mongoose from "mongoose";
import { loadEnvFiles } from "./load-env";

loadEnvFiles();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("SUCCESS: connected, readyState =", mongoose.connection.readyState);
    console.log("Database:", mongoose.connection.db?.databaseName);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("FAILED:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
