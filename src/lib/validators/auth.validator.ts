import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
});

/** Step 1 — send signed complete-registration link */
export const startRegistrationSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

/** Step 2 — finish signup after email link click */
export const completeRegistrationSchema = z.object({
  email: z.string().email("Enter a valid email"),
  token: z.string().min(20).max(2000),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type StartRegistrationInput = z.infer<typeof startRegistrationSchema>;
export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
