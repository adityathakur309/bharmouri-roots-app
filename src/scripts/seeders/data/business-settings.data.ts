import type { SeedSetting } from "./settings.data";

/** Genuine BharmouriRoots defaults for public/admin business settings. */
export function getBusinessSeedSettings(): SeedSetting[] {
  return [
    {
      key: "site.name",
      value: "BharmouriRoots",
      group: "business",
      description: "Public business / brand name",
    },
    {
      key: "site.email",
      value: "hello@bharmouriroots.com",
      group: "business",
      description: "Primary public email",
    },
    {
      key: "site.phone",
      value: "+91 98050 00000",
      group: "business",
      description: "Primary public phone",
    },
    {
      key: "site.support_email",
      value: "support@bharmouriroots.com",
      group: "business",
      description: "Customer support email",
    },
    {
      key: "site.support_phone",
      value: "+91 88949 85606",
      group: "business",
      description: "Customer support phone",
    },
    {
      key: "site.address_line",
      value: "Near Main Bazaar, Bharmour",
      group: "business",
      description: "Street / locality address",
    },
    {
      key: "site.city",
      value: "Bharmour",
      group: "business",
      description: "City",
    },
    {
      key: "site.state",
      value: "Himachal Pradesh",
      group: "business",
      description: "State",
    },
    {
      key: "site.pincode",
      value: "176315",
      group: "business",
      description: "PIN code",
    },
    {
      key: "site.country",
      value: "India",
      group: "business",
      description: "Country",
    },
    {
      key: "site.hours",
      value: "Mon–Sat, 9:00 AM – 6:00 PM IST",
      group: "business",
      description: "Support / store hours",
    },
    {
      key: "site.whatsapp",
      value: "918894985606",
      group: "business",
      description: "WhatsApp number (digits with country code)",
    },
    {
      key: "site.instagram",
      value: "https://www.instagram.com/manimaheshhikersofficial",
      group: "business",
      description: "Instagram profile URL",
    },
    {
      key: "commerce.cod_enabled",
      value: false,
      group: "commerce",
      description: "Global Cash on Delivery switch (default off)",
    },
    {
      key: "shipping.free_above",
      value: 999,
      group: "commerce",
      description: "Free shipping cart threshold (INR)",
    },
  ];
}
