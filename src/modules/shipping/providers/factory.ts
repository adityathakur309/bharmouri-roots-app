import type { IShippingProvider, ShippingProviderName } from "./types";
import { mockShippingProvider } from "./mock.provider";
import { shiprocketProvider } from "./shiprocket.provider";

function hasShiprocketCredentials(): boolean {
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

/**
 * Provider for serviceability / estimate (safe read APIs only).
 *
 * - SHIPPING_PROVIDER=mock → always mock
 * - SHIPPING_PROVIDER=shiprocket → Shiprocket when credentials exist
 * - unset → auto Shiprocket when credentials look real
 *
 * Note: SHIPPING_MOCK_MODE does NOT force estimate mock — that flag is reserved
 * for booking/create operations (see getBookingProvider).
 */
export function getEstimateProvider(): IShippingProvider {
  const named = process.env.SHIPPING_PROVIDER?.trim().toLowerCase();
  if (named === "mock") return mockShippingProvider;
  if (named === "shiprocket") {
    return hasShiprocketCredentials() ? shiprocketProvider : mockShippingProvider;
  }
  return hasShiprocketCredentials() ? shiprocketProvider : mockShippingProvider;
}

/**
 * Provider for createShipment / AWB / pickup / live track.
 *
 * Always Mock for now — never creates real Shiprocket shipments.
 * SHIPPING_MOCK_MODE=true documents/intent-locks this behavior.
 * Later: implement ShiprocketProvider.createShipment and allow
 * SHIPPING_BOOKING_PROVIDER=shiprocket when SHIPPING_MOCK_MODE=false.
 */
export function getBookingProvider(): IShippingProvider {
  // Hard-guard until production go-live.
  // SHIPPING_MOCK_MODE and SHIPPING_BOOKING_PROVIDER are intentionally ignored
  // so nothing can accidentally create a live Shiprocket shipment.
  void process.env.SHIPPING_MOCK_MODE;
  void process.env.SHIPPING_BOOKING_PROVIDER;
  return mockShippingProvider;
}

export function getActiveProviders(): {
  estimate: ShippingProviderName;
  booking: ShippingProviderName;
} {
  return {
    estimate: getEstimateProvider().name,
    booking: getBookingProvider().name,
  };
}
