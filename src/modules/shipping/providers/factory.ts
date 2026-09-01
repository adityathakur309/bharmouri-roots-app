import type { IShippingProvider, ShippingProviderName } from "./types";
import { mockShippingProvider } from "./mock.provider";
import { shiprocketProvider } from "./shiprocket.provider";
import {
  hasShiprocketCredentials,
  isShippingMockMode,
} from "../shipping-mode";

/**
 * Provider for serviceability / estimate.
 * Mock when SHIPROCKET_MOCK / SHIPPING_MOCK_MODE is true, or credentials missing.
 */
export function getEstimateProvider(): IShippingProvider {
  if (isShippingMockMode()) return mockShippingProvider;

  const named = process.env.SHIPPING_PROVIDER?.trim().toLowerCase();
  if (named === "mock") return mockShippingProvider;
  if (named === "shiprocket") {
    return hasShiprocketCredentials() ? shiprocketProvider : mockShippingProvider;
  }
  return hasShiprocketCredentials() ? shiprocketProvider : mockShippingProvider;
}

/**
 * Provider for createShipment / AWB / live track.
 * - Mock when SHIPROCKET_MOCK / SHIPPING_MOCK_MODE is true (default safe path)
 * - Live Shiprocket when mock is false and credentials are configured
 */
export function getBookingProvider(): IShippingProvider {
  if (isShippingMockMode()) return mockShippingProvider;

  const bookingNamed = process.env.SHIPPING_BOOKING_PROVIDER?.trim().toLowerCase();
  if (bookingNamed === "mock") return mockShippingProvider;

  if (!hasShiprocketCredentials()) {
    return mockShippingProvider;
  }

  return shiprocketProvider;
}

export function getActiveProviders(): {
  estimate: ShippingProviderName;
  booking: ShippingProviderName;
  mockMode: boolean;
} {
  return {
    estimate: getEstimateProvider().name,
    booking: getBookingProvider().name,
    mockMode: isShippingMockMode(),
  };
}
