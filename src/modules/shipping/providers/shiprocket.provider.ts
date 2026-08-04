import axios, { type AxiosError, type AxiosInstance } from "axios";
import { AppError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type {
  CreateShipmentInput,
  CourierQuote,
  IShippingProvider,
  ServiceabilityParams,
  ShippingEstimateResult,
  ShipmentBookingResult,
  TrackingResult,
} from "./types";

interface ShiprocketToken {
  token: string;
  expiresAt: number;
}

let cachedToken: ShiprocketToken | null = null;

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";
const MAX_RETRIES = 2;

function shiprocketErrorMessage(error: unknown, fallback: string): string {
  const ax = error as AxiosError<{ message?: string; error?: string }>;
  const data = ax.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  if (ax.message) return `${fallback}: ${ax.message}`;
  return fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Live Shiprocket provider for safe-read APIs (auth, serviceability, estimate).
 * Booking methods throw — booking stays on MockShippingProvider until go-live.
 */
export class ShiprocketProvider implements IShippingProvider {
  readonly name = "shiprocket" as const;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SHIPROCKET_BASE,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
  }

  private async authenticate(force = false): Promise<string> {
    if (!force && cachedToken && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    const email = process.env.SHIPROCKET_EMAIL?.trim();
    const password = process.env.SHIPROCKET_PASSWORD?.trim();
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
        expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000, // ~9 days
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

  private async withAuthRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const token = await this.authenticate(attempt > 0);
        return await fn(token);
      } catch (error) {
        lastError = error;
        const status = (error as AxiosError)?.response?.status;
        // Refresh token once on unauthorized
        if (status === 401 && attempt < MAX_RETRIES) {
          cachedToken = null;
          continue;
        }
        // Transient retry
        if (status && status >= 500 && attempt < MAX_RETRIES) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        break;
      }
    }
    throw lastError;
  }

  async checkServiceability(params: ServiceabilityParams) {
    try {
      return await this.withAuthRetry(async (token) => {
        const { data } = await this.client.get("/courier/serviceability/", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            pickup_postcode: params.pickupPincode,
            delivery_postcode: params.deliveryPincode,
            weight: params.weight,
            cod: params.cod ? 1 : 0,
          },
        });
        return data;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Shiprocket serviceability failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to check serviceability"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }

  private mapCouriers(raw: unknown, codRequested: boolean): CourierQuote[] {
    const root = raw as {
      data?: { available_courier_companies?: Array<Record<string, unknown>> };
      available_courier_companies?: Array<Record<string, unknown>>;
    };
    const list =
      root?.data?.available_courier_companies ??
      root?.available_courier_companies ??
      [];

    return list.map((c) => {
      const rate = Number(c.rate ?? c.freight_charge ?? 0);
      const codFlag = c.cod ?? c.cod_available;
      const codAvailable =
        codFlag === 1 ||
        codFlag === true ||
        codFlag === "1" ||
        codFlag === "Yes" ||
        codFlag === "yes";
      return {
        courierId: (c.courier_company_id ?? c.courier_id ?? "") as string | number,
        courierName: String(c.courier_name ?? "Courier"),
        rate: Number.isFinite(rate) ? rate : 0,
        estimatedDays: String(
          c.estimated_delivery_days ?? c.etd ?? c.eta ?? "5-7"
        ),
        codAvailable: codRequested ? codAvailable || true : true,
      };
    });
  }

  async estimateShipping(params: ServiceabilityParams): Promise<ShippingEstimateResult> {
    const raw = await this.checkServiceability(params);
    const couriers = this.mapCouriers(raw, params.cod);
    const recommended =
      [...couriers].sort((a, b) => a.rate - b.rate)[0] ?? null;

    return {
      serviceable: couriers.length > 0,
      deliveryAvailable: couriers.length > 0,
      codAvailable: params.cod
        ? couriers.some((c) => c.codAvailable)
        : couriers.length > 0,
      shippingCharge: recommended?.rate ?? null,
      estimatedDeliveryDays: recommended?.estimatedDays ?? null,
      couriers,
      recommended,
      provider: "shiprocket",
      raw,
    };
  }

  async createShipment(_input: CreateShipmentInput): Promise<ShipmentBookingResult> {
    throw new AppError(
      "Live Shiprocket shipment creation is disabled. Use Mock booking provider until production go-live.",
      501,
      "SHIPPING_BOOKING_DISABLED"
    );
  }

  async trackShipment(_shipmentId: string): Promise<TrackingResult> {
    throw new AppError(
      "Live Shiprocket tracking is disabled. Use Mock booking provider until production go-live.",
      501,
      "SHIPPING_TRACKING_DISABLED"
    );
  }
}

export const shiprocketProvider = new ShiprocketProvider();
