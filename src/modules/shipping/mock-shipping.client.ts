/**
 * @deprecated Prefer `shippingService` / providers via `@/modules/shipping`.
 * Kept so older imports keep working.
 */
export { mockShippingProvider as mockShippingClient } from "./providers/mock.provider";
export { MockShippingProvider } from "./providers/mock.provider";
export { isShippingMockMode as isMockShippingMode } from "./shipping-mode";
