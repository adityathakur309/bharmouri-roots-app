import mongoose from "mongoose";
import { logger } from "@/lib/utils/logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var mongooseListenersAttached: boolean | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

function attachConnectionListeners() {
  if (global.mongooseListenersAttached) return;
  global.mongooseListenersAttached = true;

  mongoose.connection.on("disconnected", () => {
    cached.conn = null;
    cached.promise = null;
    logger.warn("MongoDB disconnected — will reconnect on next request");
  });

  mongoose.connection.on("error", (err) => {
    cached.conn = null;
    cached.promise = null;
    logger.error("MongoDB connection error", err instanceof Error ? err.message : err);
  });
}

function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<typeof mongoose> {
  attachConnectionListeners();

  if (isConnected()) {
    return mongoose;
  }

  if (cached.conn && isConnected()) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Add it to .env.local");
  }

  if (!cached.promise) {
    logger.info("Connecting to MongoDB…");
    cached.promise = mongoose
      .connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      })
      .then((conn) => {
        logger.info("MongoDB connected");
        return conn;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    const message = error instanceof Error ? error.message : String(error);
    logger.error("MongoDB connection failed", message);
    throw new Error(
      `Could not connect to MongoDB. Check MONGODB_URI, Atlas IP whitelist (0.0.0.0/0 for dev), and network. Details: ${message}`
    );
  }
}
