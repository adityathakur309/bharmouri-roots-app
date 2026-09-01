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
 * Live Shiprocket provider: auth, serviceability, estimate, createShipment, track.
 * Selected only when shipping mock mode is false and credentials are configured.
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

  async createShipment(input: CreateShipmentInput): Promise<ShipmentBookingResult> {
    try {
      return await this.withAuthRetry(async (token) => {
        const nameParts = input.billing.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] ?? "Customer";
        const lastName = nameParts.slice(1).join(" ") || ".";

        const payload = {
          order_id: input.orderNumber,
          order_date: input.orderDate,
          pickup_location: input.pickupLocation || "Primary",
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: input.billing.addressLine,
          billing_address_2: "",
          billing_city: input.billing.city,
          billing_pincode: input.billing.pincode,
          billing_state: input.billing.state,
          billing_country: input.billing.country || "India",
          billing_email: input.billing.email,
          billing_phone: input.billing.phone.replace(/\D/g, "").slice(-10),
          shipping_is_billing: true,
          order_items: input.items.map((item) => ({
            name: item.name,
            sku: item.sku,
            units: item.units,
            selling_price: item.sellingPrice,
          })),
          payment_method: input.paymentMethod,
          sub_total: input.subTotal,
          length: 10,
          breadth: 10,
          height: 10,
          weight: Math.max(0.5, input.weight),
        };

        const { data } = await this.client.post("/orders/create/adhoc", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orderId = String(
          data?.order_id ?? data?.payload?.order_id ?? data?.data?.order_id ?? ""
        );
        const shipmentId = String(
          data?.shipment_id ??
            data?.payload?.shipment_id ??
            data?.data?.shipment_id ??
            ""
        );

        if (!orderId && !shipmentId) {
          logger.error("Shiprocket create order unexpected response", { data });
          throw new AppError(
            "Shiprocket did not return a shipment id",
            502,
            "SHIPROCKET_ERROR"
          );
        }

        let awbCode: string | undefined =
          data?.awb_code ?? data?.payload?.awb_code ?? undefined;
        let courierName: string | undefined =
          data?.courier_name ?? data?.payload?.courier_name ?? undefined;

        // Best-effort AWB assignment when shipment exists without AWB yet
        if (shipmentId && !awbCode) {
          try {
            const assign = await this.client.post(
              "/courier/assign/awb",
              { shipment_id: Number(shipmentId) || shipmentId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            awbCode =
              assign.data?.response?.data?.awb_code ??
              assign.data?.awb_code ??
              awbCode;
            courierName =
              assign.data?.response?.data?.courier_name ??
              assign.data?.courier_name ??
              courierName;
          } catch (assignError) {
            logger.warn("Shiprocket AWB assign skipped", {
              shipmentId,
              message:
                assignError instanceof Error
                  ? assignError.message
                  : String(assignError),
            });
          }
        }

        return {
          provider: "shiprocket" as const,
          shiprocketOrderId: orderId || shipmentId,
          shiprocketShipmentId: shipmentId || orderId,
          awbCode,
          trackingId: awbCode,
          courierName,
          shippingCharge: undefined,
          estimatedDelivery: undefined,
          shipmentStatus: awbCode ? "awb_assigned" : "shipment_created",
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Shiprocket createShipment failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to create Shiprocket shipment"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }

  async trackShipment(shipmentId: string): Promise<TrackingResult> {
    try {
      return await this.withAuthRetry(async (token) => {
        const { data } = await this.client.get(
          `/courier/track/shipment/${shipmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const tracking =
          data?.tracking_data ?? data?.data?.tracking_data ?? data ?? {};
        const activities: Array<Record<string, unknown>> =
          tracking?.shipment_track_activities ??
          tracking?.track_activities ??
          [];

        const events = (Array.isArray(activities) ? activities : []).map(
          (a) => ({
            status: String(a.status ?? a["sr-status"] ?? "update"),
            activity: String(a.activity ?? a["sr-status-label"] ?? a.status ?? ""),
            location: a.location ? String(a.location) : undefined,
            date: a.date ? String(a.date) : undefined,
          })
        );

        return {
          provider: "shiprocket",
          shipmentId,
          events,
          raw: data,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Shiprocket trackShipment failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to track Shiprocket shipment"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }

  /**
   * Schedule a reverse/return pickup.
   * Uses Shiprocket return order API when available; validates response shape.
   */
  async scheduleReturnPickup(
    input: import("./types").ScheduleReturnPickupInput
  ): Promise<import("./types").ReturnPickupResult> {
    try {
      return await this.withAuthRetry(async (token) => {
        const warehouse =
          process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary";
        const payload = {
          order_id: `${input.orderNumber}-RET-${input.refundRequestNumber}`,
          order_date: new Date().toISOString().split("T")[0],
          channel_id: "",
          pickup_customer_name: input.customer.fullName,
          pickup_last_name: "",
          pickup_address: input.customer.addressLine,
          pickup_address_2: "",
          pickup_city: input.customer.city,
          pickup_state: input.customer.state,
          pickup_country: "India",
          pickup_pincode: input.customer.pincode,
          pickup_email: input.customer.email ?? "",
          pickup_phone: input.customer.phone,
          pickup_isd_code: "91",
          shipping_customer_name: warehouse,
          shipping_last_name: "",
          shipping_address: process.env.SHIPROCKET_RETURN_ADDRESS ?? "Warehouse",
          shipping_address_2: "",
          shipping_city: process.env.SHIPROCKET_RETURN_CITY ?? "Bharmour",
          shipping_country: "India",
          shipping_pincode:
            process.env.SHIPROCKET_PICKUP_PINCODE ?? "176315",
          shipping_state: process.env.SHIPROCKET_RETURN_STATE ?? "Himachal Pradesh",
          shipping_email: process.env.SHIPROCKET_RETURN_EMAIL ?? "",
          shipping_isd_code: "91",
          shipping_phone: process.env.SHIPROCKET_RETURN_PHONE ?? "9999999999",
          order_items: input.items.map((i) => ({
            name: i.name,
            sku: i.sku ?? i.name,
            units: i.units,
            selling_price: i.sellingPrice,
            discount: 0,
            qc_enable: true,
          })),
          payment_method: "Prepaid",
          sub_total: input.items.reduce(
            (s, i) => s + i.sellingPrice * i.units,
            0
          ),
          length: 10,
          breadth: 10,
          height: 10,
          weight: input.weight ?? 0.5,
        };

        const { data } = await this.client.post(
          "/orders/create/return",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const orderId = String(
          data?.order_id ?? data?.payload?.order_id ?? data?.data?.order_id ?? ""
        );
        const shipmentId = String(
          data?.shipment_id ??
            data?.payload?.shipment_id ??
            data?.data?.shipment_id ??
            orderId
        );

        if (!orderId && !shipmentId) {
          throw new AppError(
            "Shiprocket did not return a return pickup id",
            502,
            "SHIPROCKET_ERROR"
          );
        }

        return {
          provider: "shiprocket" as const,
          pickupId: shipmentId || orderId,
          awbCode: data?.awb_code ? String(data.awb_code) : undefined,
          trackingId: data?.awb_code ? String(data.awb_code) : shipmentId,
          courierName: data?.courier_name
            ? String(data.courier_name)
            : undefined,
          scheduledAt:
            input.scheduledAt ?? new Date(Date.now() + 86400000).toISOString(),
          status: "pickup_scheduled",
          raw: data,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Shiprocket scheduleReturnPickup failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        shiprocketErrorMessage(error, "Failed to schedule return pickup"),
        502,
        "SHIPROCKET_ERROR"
      );
    }
  }
}

export const shiprocketProvider = new ShiprocketProvider();
