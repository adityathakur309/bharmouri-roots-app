import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  SHIPROCKET_EMAIL: z.string().email().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_PICKUP_PINCODE: z.string().default("176315"),
  SHIPROCKET_PICKUP_LOCATION: z.string().default("Primary"),
  ADMIN_EMAIL: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  return parsed.data;
}

/** Validated environment — lazy so build can proceed without DB in CI */
let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) cached = parseEnv();
  return cached;
}

export const isProduction = () => getEnv().NODE_ENV === "production";
export const isGoogleOAuthEnabled = () =>
  Boolean(getEnv().GOOGLE_CLIENT_ID && getEnv().GOOGLE_CLIENT_SECRET);
