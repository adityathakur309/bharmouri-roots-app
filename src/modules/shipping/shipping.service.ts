import { shiprocketClient } from "./shiprocket.client";

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

    const cheapest = rates.sort(
      (a, b) => Number(a.rate ?? 0) - Number(b.rate ?? 0)
    )[0];

    return {
      serviceable: rates.length > 0,
      rates,
      recommended: cheapest ?? null,
    };
  }
}

export const shippingService = new ShippingService();
