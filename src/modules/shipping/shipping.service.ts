import { shiprocketClient } from "./shiprocket.client";
import { logger } from "@/lib/utils/logger";
import type { IOrder } from "@/lib/db/models/order.model";

export interface ShipmentBookingResult {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  awbCode?: string;
  trackingId?: string;
  courierName?: string;
}

export class ShippingService {
  async checkServiceability(params: {
    pickupPincode?: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }) {
    const pickupPincode =
      params.pickupPincode ?? process.env.SHIPROCKET_PICKUP_PINCODE ?? "176315";

    return shiprocketClient.checkServiceability({
      pickupPincode,
      deliveryPincode: params.deliveryPincode,
      weight: params.weight,
      cod: params.cod,
    });
  }

  async estimateShipping(params: {
    pickupPincode?: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }) {
    const data = await this.checkServiceability(params);
    const couriers =
      data?.data?.available_courier_companies ??
      data?.available_courier_companies ??
      [];

    const rates = (couriers as Array<Record<string, unknown>>).map((c) => ({
      courierId: c.courier_company_id ?? c.courier_id,
      courierName: c.courier_name,
      rate: c.rate ?? c.freight_charge,
      estimatedDays: c.estimated_delivery_days ?? c.etd,
    }));

    const cheapest = [...rates].sort(
      (a, b) => Number(a.rate ?? 0) - Number(b.rate ?? 0)
    )[0];

    return {
      serviceable: rates.length > 0,
      rates,
      recommended: cheapest ?? null,
    };
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
   * Create Shiprocket adhoc order and assign AWB when missing.
   * Reusable booking entry-point for admin shipment creation.
   */
  async createShipmentForOrder(order: IOrder): Promise<ShipmentBookingResult> {
    const addr = order.shippingAddress;
    const weight = Math.max(
      0.5,
      order.items.reduce((sum, item) => sum + item.quantity * 0.25, 0)
    );

    const payload = {
      order_id: order.orderNumber,
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
      billing_customer_name: addr.fullName,
      billing_last_name: "",
      billing_address: addr.addressLine,
      billing_city: addr.city,
      billing_pincode: addr.pincode,
      billing_state: addr.state,
      billing_country: "India",
      billing_email: addr.email,
      billing_phone: addr.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.name,
        sku: item.slug,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: 10,
      breadth: 10,
      height: 10,
      weight,
    };

    const result = (await shiprocketClient.createOrder(payload)) as Record<
      string,
      unknown
    >;

    const shipmentIdRaw = result.shipment_id ?? result.shipmentId;
    const shiprocketShipmentId = shipmentIdRaw != null ? String(shipmentIdRaw) : "";
    const shiprocketOrderId = String(
      result.order_id ?? result.orderId ?? shiprocketShipmentId
    );

    let awb =
      (result.awb_code as string | undefined) ??
      (result.awb as string | undefined);
    let courierName = result.courier_name as string | undefined;
    let trackingId =
      (result.tracking_id as string | undefined) ?? awb;

    // Assign AWB when create response did not include one
    if (!awb && shiprocketShipmentId) {
      try {
        const courierId =
          (result.courier_company_id as number | undefined) ??
          (result.courier_id as number | undefined);

        const awbResult = (await shiprocketClient.assignAwb(
          Number(shiprocketShipmentId),
          courierId
        )) as Record<string, unknown>;

        const nested = awbResult.response as Record<string, unknown> | undefined;
        awb =
          (awbResult.awb_code as string | undefined) ??
          (nested?.data as { awb_code?: string } | undefined)?.awb_code ??
          (awbResult.awb as string | undefined);
        courierName =
          courierName ??
          (awbResult.courier_name as string | undefined) ??
          (nested?.data as { courier_name?: string } | undefined)?.courier_name;
        trackingId = awb ?? trackingId;
      } catch (error) {
        logger.warn("AWB assignment skipped/failed; shipment still created", {
          orderId: String(order._id),
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      shiprocketOrderId,
      shiprocketShipmentId,
      awbCode: awb,
      trackingId: trackingId ?? awb,
      courierName,
    };
  }

  async trackShipment(shipmentId: string) {
    return shiprocketClient.trackShipment(shipmentId);
  }
}

export const shippingService = new ShippingService();
