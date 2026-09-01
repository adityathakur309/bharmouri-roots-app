import { PolicyShell, buildPageMetadata } from "@/components/legal/policy-shell";

export const metadata = buildPageMetadata({
  title: "Shipping Policy",
  description:
    "Shipping timelines, charges, free-shipping threshold, and delivery coverage for BharmouriRoots orders.",
  path: "/shipping",
});

export default function ShippingPolicyPage() {
  return (
    <PolicyShell title="Shipping Policy">
      <h2>1. Coverage</h2>
      <p>
        We ship across serviceable pincodes in India. Availability is checked at checkout using our
        shipping partner (Shiprocket when live mode is configured).
      </p>

      <h2>2. Processing time</h2>
      <p>
        Orders are typically packed within 1–2 business days after payment confirmation (or COD
        confirmation). Remote mountain pickup locations may add a day during weather disruptions.
      </p>

      <h2>3. Delivery estimates</h2>
      <p>
        Standard delivery is usually 5–7 business days after dispatch. Exact estimates shown at
        checkout or on the order page are provided by the courier network and may vary.
      </p>

      <h2>4. Shipping charges</h2>
      <ul>
        <li>Free shipping may apply above the store threshold (default ₹999; configurable).</li>
        <li>Below the threshold, a flat or courier-quoted charge may apply.</li>
        <li>Remote areas may have higher courier rates when live shipping is enabled.</li>
      </ul>

      <h2>5. Tracking</h2>
      <p>
        Once a shipment is created, tracking details (AWB / tracking ID) appear in your order
        dashboard when available from the courier.
      </p>

      <h2>6. Failed delivery</h2>
      <p>
        Please ensure phone number and address are correct. Failed attempts due to unreachable
        recipients may incur reattempt or return-to-origin handling per courier rules.
      </p>

      <h2>7. Contact</h2>
      <p>For shipping help, use Contact Us with your order number.</p>
    </PolicyShell>
  );
}
