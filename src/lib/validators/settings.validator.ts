import { z } from "zod";

export const updateBusinessSettingsSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(30).optional(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().min(8).max(30).optional(),
  addressLine: z.string().min(3).max(200).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  country: z.string().min(2).max(80).optional(),
  hours: z.string().min(3).max(120).optional(),
  whatsapp: z.string().min(8).max(20).optional(),
  instagram: z.string().url().optional(),
  codEnabled: z.boolean().optional(),
  freeShippingAbove: z.number().min(0).max(100000).optional(),
});

export type UpdateBusinessSettingsInput = z.infer<
  typeof updateBusinessSettingsSchema
>;
