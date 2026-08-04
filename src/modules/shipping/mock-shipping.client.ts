/**
 * @deprecated Prefer `shippingService` / providers via `@/modules/shipping`.
 * Kept so older imports keep working; booking always uses MockShippingProvider.
 */
export { mockShippingProvider as mockShippingClient } from "./providers/mock.provider";
export { MockShippingProvider } from "./providers/mock.provider";

/** @deprecated Use SHIPPING_MOCK_MODE / factory instead */
export function isMockShippingMode() {
  return process.env.SHIPPING_MOCK_MODE?.trim().toLowerCase() === "true";
}
