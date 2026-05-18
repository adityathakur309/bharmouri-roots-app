import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  addressLine: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
