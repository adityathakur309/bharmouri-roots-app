/**
 * Active providers: estimate uses Shiprocket (when configured);
 * booking uses Mock until go-live.
 */
export { shippingService } from "./shipping.service";
export { shippingController } from "./shipping.controller";
export {
  getEstimateProvider,
  getBookingProvider,
  getActiveProviders,
} from "./providers/factory";
export type {
  ShippingEstimateResult,
  ShipmentBookingResult,
  TrackingResult,
  IShippingProvider,
} from "./providers/types";
