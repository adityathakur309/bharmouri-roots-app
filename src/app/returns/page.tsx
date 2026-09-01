import { PolicyShell, buildPageMetadata } from "@/components/legal/policy-shell";

export const metadata = buildPageMetadata({
  title: "Refund & Cancellation Policy",
  description:
    "Refund, return, and cancellation rules for BharmouriRoots orders including Razorpay refunds.",
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <PolicyShell title="Refund & Cancellation Policy">
      <h2>1. Cancellation by customer</h2>
      <ul>
        <li>
          Prepaid orders may be cancelled before the order is confirmed/packed by contacting support
          promptly with your order number.
        </li>
        <li>
          Once shipped, cancellation is not possible; you may refuse delivery or request a return
          where eligible.
        </li>
        <li>COD orders can usually be cancelled before dispatch.</li>
      </ul>

      <h2>2. Cancellation by us</h2>
      <p>
        We may cancel orders for stock issues, pricing errors, failed verification, or suspected
        fraud. Any amount collected is refunded to the original payment method.
      </p>

      <h2>3. Returns</h2>
      <ul>
        <li>
          Non-perishable goods: request within 7 days of delivery for damaged, incorrect, or
          defective items. Share photos and order details.
        </li>
        <li>
          Food / perishable / opened consumables: returns are limited for hygiene and safety;
          quality issues reported on delivery will be reviewed case by case.
        </li>
        <li>Items must be unused and in original packaging where applicable.</li>
      </ul>

      <h2>4. Refunds</h2>
      <ul>
        <li>
          Approved prepaid refunds are processed via Razorpay to the original payment instrument.
        </li>
        <li>
          Bank/UPI reflection typically takes 5–10 business days after refund initiation, depending
          on the bank.
        </li>
        <li>COD refunds (if applicable) are arranged via support after return verification.</li>
      </ul>

      <h2>5. How to request</h2>
      <p>
        Use Contact Us or your order page notes with order ID, reason, and photos. Our team will
        confirm next steps.
      </p>
    </PolicyShell>
  );
}
