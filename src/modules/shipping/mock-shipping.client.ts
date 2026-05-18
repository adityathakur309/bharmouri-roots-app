import { customAlphabet } from "nanoid";

const trackingAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export function isMockShippingMode(): boolean {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return true;
  if (email.includes("example.com") || password.includes("your_")) return true;
  return process.env.SHIPPING_MOCK_MODE === "true";
}

export class MockShippingClient {
  async checkServiceability(params: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }) {
    void params;
    return {
      data: {
        available_courier_companies: [
          {
            courier_company_id: 101,
            courier_name: "Himalaya Express (Demo)",
            rate: 80,
            estimated_delivery_days: "5-7",
          },
          {
            courier_company_id: 102,
            courier_name: "Pahadi Logistics (Demo)",
            rate: 120,
            estimated_delivery_days: "3-5",
          },
        ],
      },
    };
  }

  async createOrder(_payload: Record<string, unknown>) {
    const trackingId = `BR${trackingAlphabet()}`;
    const shipmentId = Math.floor(100000 + Math.random() * 900000);
    return {
      order_id: `SR-MOCK-${Date.now()}`,
      shipment_id: shipmentId,
      awb_code: trackingId,
      tracking_id: trackingId,
      courier_name: "Himalaya Express (Demo)",
    };
  }

  async trackShipment(shipmentId: string) {
    const now = Date.now();
    return {
      tracking_data: {
        shipment_track: [
          {
            current_status: "Delivered",
            shipment_status: "DEL",
            activity: "Delivered to customer",
            location: "Chamba, HP",
            date: new Date(now - 86400000).toISOString(),
          },
          {
            current_status: "Out for Delivery",
            shipment_status: "OFD",
            activity: "Out for delivery",
            location: "Chamba Hub",
            date: new Date(now - 172800000).toISOString(),
          },
          {
            current_status: "Shipped",
            shipment_status: "SHP",
            activity: "Shipment picked up",
            location: "Bharmour Warehouse",
            date: new Date(now - 345600000).toISOString(),
          },
          {
            current_status: "Order Confirmed",
            shipment_status: "PKD",
            activity: "Shipment created",
            location: "Bharmour, HP",
            date: new Date(now - 432000000).toISOString(),
          },
        ],
        shipment_id: shipmentId,
      },
    };
  }
}

export const mockShippingClient = new MockShippingClient();
