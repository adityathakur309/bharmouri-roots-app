import { logger } from "@/lib/utils/logger";
import type { IOrder } from "@/lib/db/models/order.model";
import { getBookingProvider, getEstimateProvider, getActiveProviders } from "./providers/factory";
import type {
  CreateShipmentInput,
  ShippingEstimateResult,
  ShipmentBookingResult,
  TrackingResult,
} from "./providers/types";

export type { ShippingEstimateResult, ShipmentBookingResult, TrackingResult };

function pickupPincode(fallback?: string) {
  return (
    fallback ??
    process.env.SHIPROCKET_PICKUP_PINCODE ??
    "176315"
  );
}

export class ShippingService {
  getProviders() {
    return getActiveProviders();
  }

  async checkServiceability(params: {
    pickupPincode?: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }) {
    const provider = getEstimateProvider();
    const raw = await provider.checkServiceability({
      pickupPincode: pickupPincode(params.pickupPincode),
      deliveryPincode: params.deliveryPincode,
      weight: params.weight,
      cod: params.cod,
    });
    return raw;
  }

  async estimateShipping(params: {
    pickupPincode?: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }): Promise<ShippingEstimateResult> {
    const provider = getEstimateProvider();
    try {
      return await provider.estimateShipping({
        pickupPincode: pickupPincode(params.pickupPincode),
        deliveryPincode: params.deliveryPincode,
        weight: params.weight,
        cod: params.cod,
      });
    } catch (error) {
      logger.error("Shipping estimate failed", {
        provider: provider.name,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /** True when at least one courier is available for the pincode. */
  async isServiceable(deliveryPincode: string, cod: boolean, weight = 0.5) {
    const estimate = await this.estimateShipping({
      deliveryPincode,
      weight,
      cod,
    });
    return estimate.serviceable;
  }

  /**
   * Create shipment via booking provider (mock by default).
   * Persists the same fields as a live Shiprocket booking.
   */
  async createShipmentForOrder(order: IOrder): Promise<ShipmentBookingResult> {
    const addr = order.shippingAddress;
    const weight = Math.max(
      0.5,
      order.items.reduce((sum, item) => sum + item.quantity * 0.25, 0)
    );

    const input: CreateShipmentInput = {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      orderDate: new Date().toISOString().split("T")[0],
      paymentMethod: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      subTotal: order.total,
      weight,
      pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
      billing: {
        fullName: addr.fullName,
        phone: addr.phone,
        email: addr.email,
        addressLine: addr.addressLine,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: "India",
      },
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.slug,
        units: item.quantity,
        sellingPrice: item.price,
      })),
    };

    const provider = getBookingProvider();
    const result = await provider.createShipment(input);
    logger.info("Shipment booked via provider", {
      provider: result.provider,
      orderId: String(order._id),
      shipmentId: result.shiprocketShipmentId,
    });
    return result;
  }

  async trackShipment(shipmentId: string): Promise<TrackingResult> {
    return getBookingProvider().trackShipment(shipmentId);
  }
}

export const shippingService = new ShippingService();
