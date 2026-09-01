/**
 * Key/value application settings. Unique by `key` for idempotent upserts.
 */
export interface PublicBusinessSettings {
  businessName: string;
  email: string;
  phone: string;
  supportEmail: string;
  supportPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  hours: string;
  whatsapp: string;
  instagram: string;
  codEnabled: boolean;
  freeShippingAbove: number;
}

export const DEFAULT_BUSINESS_SETTINGS: PublicBusinessSettings = {
  businessName: "BharmouriRoots",
  email: "hello@bharmouriroots.com",
  phone: "+91 98050 00000",
  supportEmail: "support@bharmouriroots.com",
  supportPhone: "+91 88949 85606",
  addressLine: "Near Main Bazaar, Bharmour",
  city: "Bharmour",
  state: "Himachal Pradesh",
  pincode: "176315",
  country: "India",
  hours: "Mon–Sat, 9:00 AM – 6:00 PM IST",
  whatsapp: "918894985606",
  instagram: "https://www.instagram.com/manimaheshhikersofficial",
  codEnabled: false,
  freeShippingAbove: 999,
};

export function formatBusinessAddress(s: PublicBusinessSettings): string {
  return [
    s.addressLine,
    s.city,
    s.state,
    s.pincode ? `- ${s.pincode}` : "",
    s.country,
  ]
    .filter(Boolean)
    .join(", ")
    .replace(" - ,", " -")
    .replace(/,\s*-/, " -");
}
