/**
 * Shared shipping DTOs — UI/business layer stays provider-agnostic.
 */

export type ShippingProviderName = "mock" | "shiprocket";

export interface ServiceabilityParams {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  cod: boolean;
}

export interface CourierQuote {
  courierId: string | number;
  courierName: string;
  rate: number;
  estimatedDays: string;
  codAvailable: boolean;
}

export interface ShippingEstimateResult {
  serviceable: boolean;
  deliveryAvailable: boolean;
  codAvailable: boolean;
  shippingCharge: number | null;
  estimatedDeliveryDays: string | null;
  couriers: CourierQuote[];
  recommended: CourierQuote | null;
  provider: ShippingProviderName;
  raw?: unknown;
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  paymentMethod: "COD" | "Prepaid";
  subTotal: number;
  weight: number;
  pickupLocation: string;
  billing: {
    fullName: string;
    phone: string;
    email: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
  }>;
}

export interface ShipmentBookingResult {
  provider: ShippingProviderName;
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  awbCode?: string;
  trackingId?: string;
  courierName?: string;
  shippingCharge?: number;
  estimatedDelivery?: string;
  shipmentStatus: string;
}

export interface TrackingEvent {
  status: string;
  activity: string;
  location?: string;
  date?: string;
}

export interface TrackingResult {
  provider: ShippingProviderName;
  shipmentId: string;
  events: TrackingEvent[];
  raw?: unknown;
}

export interface ScheduleReturnPickupInput {
  orderNumber: string;
  refundRequestNumber: string;
  scheduledAt?: string;
  scheduledSlot?: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    units: number;
    sellingPrice: number;
  }>;
  weight?: number;
}

export interface ReturnPickupResult {
  provider: ShippingProviderName;
  pickupId: string;
  awbCode?: string;
  trackingId?: string;
  courierName?: string;
  scheduledAt?: string;
  status: string;
  raw?: unknown;
}

export interface IShippingProvider {
  readonly name: ShippingProviderName;
  checkServiceability(params: ServiceabilityParams): Promise<unknown>;
  estimateShipping(params: ServiceabilityParams): Promise<ShippingEstimateResult>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentBookingResult>;
  trackShipment(shipmentId: string): Promise<TrackingResult>;
  scheduleReturnPickup?(input: ScheduleReturnPickupInput): Promise<ReturnPickupResult>;
}
