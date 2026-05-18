import { z } from "zod";

export const serviceabilitySchema = z.object({
  pickupPincode: z.string().regex(/^\d{6}$/).optional(),
  deliveryPincode: z.string().regex(/^\d{6}$/),
  weight: z.coerce.number().min(0.1).default(0.5),
  cod: z.coerce.boolean().default(false),
});

export const shippingEstimateSchema = z.object({
  pickupPincode: z.string().regex(/^\d{6}$/).optional(),
  deliveryPincode: z.string().regex(/^\d{6}$/),
  weight: z.coerce.number().min(0.1).default(0.5),
  cod: z.coerce.boolean().default(false),
});

export const createShipmentSchema = z.object({
  orderId: z.string().min(1),
});
