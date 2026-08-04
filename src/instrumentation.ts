export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const required = ["MONGODB_URI", "JWT_SECRET"] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    console.error(
      `[boot] Missing required environment variables: ${missing.join(", ")}`
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.PAYMENT_MOCK_MODE !== "true"
  ) {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId?.startsWith("rzp_") || !keySecret || keySecret.length < 10) {
      console.warn(
        "[boot] WARNING: Razorpay is not configured for production. Prepaid checkout will fail closed."
      );
    }
  }
}
