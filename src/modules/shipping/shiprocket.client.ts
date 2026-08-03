import axios, { type AxiosInstance, type AxiosError } from "axios";
import { AppError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { isMockShippingMode, mockShippingClient } from "./mock-shipping.client";

interface ShiprocketToken {
  token: string;
  expiresAt: number;
}

let cachedToken: ShiprocketToken | null = null;

/** Shiprocket external API (test accounts use the same host). */
const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

function shiprocketErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<{ message?: string; error?: string; errors?: unknown }>;
  const data = ax.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (ax.message) return `${fallback}: ${ax.message}`;
  return fallback;
}

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

    try {
      const { data } = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
        email,
        password,
      });

      if (!data?.token) {
        throw new AppError("Shiprocket authentication failed", 502, "SHIPROCKET_AUTH");
      }

      cachedToken = {
        token: data.token,
        expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
      };

      return cachedToken.token;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Shiprocket auth failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Shiprocket authentication failed"),
        502,
        "SHIPROCKET_AUTH"
      );
    }
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
      logger.error("Shiprocket serviceability check failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to check serviceability"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }

  async createOrder(payload: Record<string, unknown>) {
    if (this.isMockMode()) {
      return mockShippingClient.createOrder(payload);
    }

    try {
      const headers = await this.authHeaders();
      const { data } = await this.client.post("/orders/create/adhoc", payload, {
        headers,
      });
      return data;
    } catch (error) {
      logger.error("Shiprocket order creation failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to create shipment"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }

  async assignAwb(shipmentId: number, courierId?: number) {
    if (this.isMockMode()) {
      return mockShippingClient.assignAwb(shipmentId, courierId);
    }

    try {
      const headers = await this.authHeaders();
      const body: Record<string, unknown> = { shipment_id: shipmentId };
      if (courierId) body.courier_id = courierId;

      const { data } = await this.client.post("/courier/assign/awb", body, {
        headers,
      });
      return data;
    } catch (error) {
      logger.error("Shiprocket AWB assign failed", {
        message: error instanceof Error ? error.message : String(error),
        shipmentId,
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to assign AWB"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }

  async trackShipment(shipmentId: string) {
    if (this.isMockMode()) {
      return mockShippingClient.trackShipment(shipmentId);
    }

    try {
      const headers = await this.authHeaders();
      const { data } = await this.client.get(
        `/courier/track/shipment/${shipmentId}`,
        { headers }
      );
      return data;
    } catch (error) {
      logger.error("Shiprocket tracking failed", {
        message: error instanceof Error ? error.message : String(error),
        shipmentId,
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to fetch tracking"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }
}

export const shiprocketClient = new ShiprocketClient();
