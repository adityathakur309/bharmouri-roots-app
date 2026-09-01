import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { logger } from "@/lib/utils/logger";
import { razorpayClient } from "@/modules/payment/razorpay.client";
import { paymentService } from "@/modules/payment/payment.service";

/**
 * Razorpay webhooks — configure in Razorpay Dashboard:
 * URL: https://bharmouriroots.com/api/payments/razorpay/webhook
 * Secret: RAZORPAY_WEBHOOK_SECRET
 * Events: payment.captured, payment.failed, refund.processed
 *
 * Note: Live webhook delivery requires Razorpay account activation / business
 * verification outside this application.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
      logger.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { success: false, message: "Webhook not configured" },
        { status: 503 }
      );
    }

    if (!razorpayClient.verifyWebhookSignature(rawBody, signature)) {
      logger.warn("Invalid Razorpay webhook signature");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    await connectDB();
    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: Record<string, unknown>;
    };

    const result = await paymentService.handleWebhookEvent(event);
    logger.info("Razorpay webhook processed", {
      event: event.event,
      result,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Razorpay webhook error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
