/**
 * Public site social / contact config.
 * Override via NEXT_PUBLIC_* env vars without redeploying UI code.
 */

const DEFAULT_WHATSAPP = "919876543210";
const DEFAULT_INSTAGRAM = "https://www.instagram.com/";
const DEFAULT_WHATSAPP_MESSAGE =
  "Hi BharmouriRoots! I would like to know more about your Himachali products.";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function getWhatsAppNumber(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  const digits = digitsOnly(fromEnv || DEFAULT_WHATSAPP);
  // Indian 10-digit mobiles → prepend country code for wa.me
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function getWhatsAppMessage(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim() || DEFAULT_WHATSAPP_MESSAGE
  );
}

export function getWhatsAppUrl(message = getWhatsAppMessage()): string {
  const phone = getWhatsAppNumber();
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}

export function getInstagramUrl(): string {
  return process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || DEFAULT_INSTAGRAM;
}

export const PARENT_BRAND = {
  name: "Manimahesh Hikers",
  url: "https://www.manimaheshhikers.com/",
  title: "Powered by Manimahesh Hikers",
  description:
    "BharmouriRoots is an initiative of Manimahesh Hikers to promote authentic organic and traditional Himachali products — connecting mountain farmers and artisans with homes across India.",
} as const;
