import { z } from "zod";
import { withHandler } from "@/lib/middleware/with-handler";
import { successResponse } from "@/lib/utils/api-response";
import type { AuthenticatedRequest, RouteContext } from "@/lib/middleware/with-handler";
import { paymentService } from "@/modules/payment/payment.service";
import { orderRepository } from "@/modules/order/order.repository";
import { NotFoundError } from "@/lib/utils/errors";

const refundSchema = z.object({
  amountInr: z.number().positive().optional(),
  reason: z.string().max(200).optional(),
});

async function refundHandler(
  request: AuthenticatedRequest,
  context?: RouteContext
) {
  const { id } = (await context?.params) ?? {};
  if (!id) throw new NotFoundError("Order not found");

  const order = await orderRepository.findById(id);
  if (!order) throw new NotFoundError("Order not found");

  const body = await request.json().catch(() => ({}));
  const input = refundSchema.parse(body ?? {});

  const result = await paymentService.refundOrderPayment(id, input);

  if (!result.alreadyRefunded) {
    await orderRepository.update(id, { paymentStatus: "refunded" });
  }

  return successResponse(result, { message: "Refund processed" });
}

export const POST = withHandler(refundHandler, { admin: true });
