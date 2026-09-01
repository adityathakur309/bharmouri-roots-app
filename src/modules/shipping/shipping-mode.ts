/**
 * Shipping mock vs live switch.
 * Supports both SHIPROCKET_MOCK and SHIPPING_MOCK_MODE (legacy alias).
 */
export function isShippingMockMode(): boolean {
  const rocket = process.env.SHIPROCKET_MOCK?.trim().toLowerCase();
  const shipping = process.env.SHIPPING_MOCK_MODE?.trim().toLowerCase();

  if (rocket === "true" || shipping === "true") return true;
  if (rocket === "false" || shipping === "false") return false;

  // Unset → mock when credentials are missing (safe default)
  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();
  const hasCreds = Boolean(
    email &&
      password &&
      password.length >= 4 &&
      !email.includes("example.com") &&
      !password.includes("your_")
  );
  return !hasCreds;
}

export function hasShiprocketCredentials(): boolean {
  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();
  return Boolean(
    email &&
      password &&
      password.length >= 4 &&
      !email.includes("example.com") &&
      !password.includes("your_")
  );
}
