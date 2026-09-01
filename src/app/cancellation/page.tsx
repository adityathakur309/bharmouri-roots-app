import { PolicyShell, buildPageMetadata } from "@/components/legal/policy-shell";

export const metadata = buildPageMetadata({
  title: "Cancellation Policy",
  description:
    "Order cancellation rules for BharmouriRoots — before packing, after payment, and COD orders.",
  path: "/cancellation",
});

export default function CancellationPage() {
  return (
    <PolicyShell title="Cancellation Policy">
      <h2>1. When you can cancel</h2>
      <p>
        You may request cancellation before the order is packed or handed to the courier. After
        dispatch, follow the Refund &amp; Return policy instead.
      </p>

      <h2>2. How to cancel</h2>
      <ol>
        <li>Open your order in the dashboard, or email/call support with the order number.</li>
        <li>We confirm whether the order is still cancellable.</li>
        <li>If already paid online, refund is initiated to the original method after approval.</li>
      </ol>

      <h2>3. COD cancellations</h2>
      <p>
        COD orders cancelled before dispatch incur no payment. Repeated frivolous COD cancellations
        may lead to COD being restricted on future orders.
      </p>

      <h2>4. Partial cancellation</h2>
      <p>
        Multi-item orders may allow partial cancellation before packing when stock/logistics allow;
        shipping charges may be recalculated.
      </p>

      <h2>5. Related policies</h2>
      <p>
        See also our <a href="/returns">Refund &amp; Cancellation / Returns</a> and{" "}
        <a href="/shipping">Shipping</a> policies.
      </p>
    </PolicyShell>
  );
}
