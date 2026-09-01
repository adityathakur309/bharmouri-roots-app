import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_BING_SITE_VERIFICATION: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  SHIPROCKET_EMAIL: z.string().email().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_PICKUP_PINCODE: z.string().default("176315"),
  SHIPROCKET_PICKUP_LOCATION: z.string().default("Primary"),
  PAYMENT_MOCK_MODE: z.enum(["true", "false"]).optional(),
  REFUND_MOCK_MODE: z.enum(["true", "false"]).optional(),
  REFUND_MOCK_OUTCOME: z.enum(["success", "failed", "pending"]).optional(),
  REFUND_WINDOW_DAYS: z.string().optional(),
  REFUND_REQUIRE_DELIVERY: z.enum(["true", "false"]).optional(),
  SEED_PURGE_INACTIVE_PRODUCTS: z.enum(["true", "false"]).optional(),
  SHIPPING_MOCK_MODE: z.enum(["true", "false"]).optional(),
  SHIPROCKET_MOCK: z.enum(["true", "false"]).optional(),
  SHIPPING_PROVIDER: z.enum(["mock", "shiprocket"]).optional(),
  SHIPPING_BOOKING_PROVIDER: z.enum(["mock", "shiprocket"]).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_NAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["smtp", "resend", "brevo"]).optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
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
