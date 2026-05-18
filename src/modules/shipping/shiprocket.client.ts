import axios, { type AxiosInstance } from "axios";
import { AppError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { isMockShippingMode, mockShippingClient } from "./mock-shipping.client";

interface ShiprocketToken {
  token: string;
  expiresAt: number;
}

let cachedToken: ShiprocketToken | null = null;

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SHIPROCKET_BASE,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
  }

  isMockMode(): boolean {
    return isMockShippingMode();
  }

  private async authenticate(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new AppError("Shiprocket is not configured", 503, "SHIPPING_NOT_CONFIGURED");
    }

    const { data } = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
      email,
      password,
    });

    if (!data?.token) {
      throw new AppError("Shiprocket authentication failed", 502);
    }

    cachedToken = {
      token: data.token,
      expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
    };

    return cachedToken.token;
  }

  private async authHeaders() {
    const token = await this.authenticate();
    return { Authorization: `Bearer ${token}` };
  }

  async checkServiceability(params: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }) {
    if (this.isMockMode()) {
      return mockShippingClient.checkServiceability(params);
    }

    try {
      const headers = await this.authHeaders();
      const { data } = await this.client.get("/courier/serviceability/", {
        headers,
        params: {
          pickup_postcode: params.pickupPincode,
          delivery_postcode: params.deliveryPincode,
          weight: params.weight,
          cod: params.cod ? 1 : 0,
        },
      });
      return data;
    } catch (error) {
      logger.error("Shiprocket serviceability check failed", error);
      throw new AppError("Failed to check serviceability", 502, "SHIPROCKET_ERROR");
    }
  }

  async createOrder(payload: Record<string, unknown>) {
    if (this.isMockMode()) {
      return mockShippingClient.createOrder(payload);
    }

    try {
      const headers = await this.authHeaders();
      const { data } = await this.client.post("/orders/create/adhoc", payload, { headers });
      return data;
    } catch (error) {
      logger.error("Shiprocket order creation failed", error);
      throw new AppError("Failed to create shipment", 502, "SHIPROCKET_ERROR");
    }
  }

  async assignAwb(shipmentId: number, courierId: number) {
    if (this.isMockMode()) {
      return { awb_code: `BR${shipmentId}` };
    }
    const headers = await this.authHeaders();
    const { data } = await this.client.post(
      "/courier/assign/awb",
      { shipment_id: shipmentId, courier_id: courierId },
      { headers }
    );
    return data;
  }

  async trackShipment(shipmentId: string) {
    if (this.isMockMode()) {
      return mockShippingClient.trackShipment(shipmentId);
    }
    const headers = await this.authHeaders();
    const { data } = await this.client.get(`/courier/track/shipment/${shipmentId}`, {
      headers,
    });
    return data;
  }
}

export const shiprocketClient = new ShiprocketClient();
