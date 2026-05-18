import mongoose from "mongoose";
import { logger } from "@/lib/utils/logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  console.log("Connecting to MongoDB");
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info("MongoDB connected");
    console.log("MongoDB connected");
  } catch (error) {
    cached.promise = null;
    logger.error("MongoDB connection failed", error);
    throw error;
    console.log("MongoDB connection failed", error);
  }

  return cached.conn;
}
