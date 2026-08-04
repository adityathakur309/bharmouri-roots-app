import { customAlphabet } from "nanoid";
import type {
  CreateShipmentInput,
  IShippingProvider,
  ServiceabilityParams,
  ShippingEstimateResult,
  ShipmentBookingResult,
  TrackingResult,
  CourierQuote,
} from "./types";

const trackingAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

function mockCouriers(cod: boolean): CourierQuote[] {
  return [
    {
      courierId: 101,
      courierName: "Himalaya Express",
      rate: 80,
      estimatedDays: "5-7",
      codAvailable: true,
    },
    {
      courierId: 102,
      courierName: "Pahadi Logistics",
      rate: 120,
      estimatedDays: "3-5",
      codAvailable: true,
    },
    {
      courierId: 103,
      courierName: "Valley Surface",
      rate: 60,
      estimatedDays: "7-10",
      codAvailable: cod,
    },
  ].filter((c) => (cod ? c.codAvailable : true));
}

/**
 * Development / staging provider.
 * Returns realistic shapes identical to live Shiprocket mappings.
 */
export class MockShippingProvider implements IShippingProvider {
  readonly name = "mock" as const;

  async checkServiceability(params: ServiceabilityParams) {
    const couriers = mockCouriers(params.cod);
    return {
      data: {
        available_courier_companies: couriers.map((c) => ({
          courier_company_id: c.courierId,
          courier_name: c.courierName,
          rate: c.rate,
          estimated_delivery_days: c.estimatedDays,
          cod: c.codAvailable ? 1 : 0,
        })),
      },
    };
  }

  async estimateShipping(params: ServiceabilityParams): Promise<ShippingEstimateResult> {
    // Simulate lightweight latency of remote call
    await new Promise((r) => setTimeout(r, 120));

    // Mock: remote/invalid-looking pincodes beginning with 000 are not serviceable
    if (params.deliveryPincode.startsWith("000")) {
      return {
        serviceable: false,
        deliveryAvailable: false,
        codAvailable: false,
        shippingCharge: null,
        estimatedDeliveryDays: null,
        couriers: [],
        recommended: null,
        provider: "mock",
      };
    }

    const couriers = mockCouriers(params.cod);
    const recommended = [...couriers].sort((a, b) => a.rate - b.rate)[0] ?? null;

    return {
      serviceable: couriers.length > 0,
      deliveryAvailable: couriers.length > 0,
      codAvailable: couriers.some((c) => c.codAvailable),
      shippingCharge: recommended?.rate ?? null,
      estimatedDeliveryDays: recommended?.estimatedDays ?? null,
      couriers,
      recommended,
      provider: "mock",
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<ShipmentBookingResult> {
    await new Promise((r) => setTimeout(r, 200));
    const trackingId = `BR${trackingAlphabet()}`;
    const shipmentId = String(Math.floor(100000 + Math.random() * 900000));
    const couriers = mockCouriers(input.paymentMethod === "COD");
    const recommended = [...couriers].sort((a, b) => a.rate - b.rate)[0];

    return {
      provider: "mock",
      shiprocketOrderId: `SR-MOCK-${Date.now()}`,
      shiprocketShipmentId: shipmentId,
      awbCode: trackingId,
      trackingId,
      courierName: recommended?.courierName ?? "Himalaya Express",
      shippingCharge: recommended?.rate ?? 80,
      estimatedDelivery: recommended?.estimatedDays ?? "5-7",
      shipmentStatus: "shipment_created",
    };
  }

  async trackShipment(shipmentId: string): Promise<TrackingResult> {
    const now = Date.now();
    return {
      provider: "mock",
      shipmentId,
      events: [
        {
          status: "Delivered",
          activity: "Delivered to customer",
          location: "Chamba, HP",
          date: new Date(now - 86400000).toISOString(),
        },
        {
          status: "Out for Delivery",
          activity: "Out for delivery",
          location: "Chamba Hub",
          date: new Date(now - 172800000).toISOString(),
        },
        {
          status: "Shipped",
          activity: "Shipment picked up",
          location: "Bharmour Warehouse",
          date: new Date(now - 345600000).toISOString(),
        },
        {
          status: "Shipment Created",
          activity: "Label generated",
          location: "Bharmour, HP",
          date: new Date(now - 432000000).toISOString(),
        },
      ],
    };
  }
}

export const mockShippingProvider = new MockShippingProvider();
