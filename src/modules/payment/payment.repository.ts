import { Payment, type IPayment, type PaymentRecordStatus } from "@/lib/db/models/payment.model";
import { Types } from "mongoose";

export class PaymentRepository {
  create(data: Partial<IPayment>) {
    return Payment.create(data);
  }

  findById(id: string) {
    return Payment.findById(id);
  }

  findByOrderId(orderId: string) {
    return Payment.find({ orderId: new Types.ObjectId(orderId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  findLatestByOrderId(orderId: string) {
    return Payment.findOne({ orderId: new Types.ObjectId(orderId) })
      .sort({ createdAt: -1 });
  }

  findByRazorpayOrderId(razorpayOrderId: string) {
    return Payment.findOne({ razorpayOrderId });
  }

  findByRazorpayPaymentId(razorpayPaymentId: string) {
    return Payment.findOne({ razorpayPaymentId });
  }

  findActiveLock(orderId: string) {
    const now = new Date();
    return Payment.findOne({
      orderId: new Types.ObjectId(orderId),
      status: { $in: ["processing", "awaiting_payment"] as PaymentRecordStatus[] },
      lockExpiresAt: { $gt: now },
    }).sort({ createdAt: -1 });
  }

  /**
   * Atomically claim payment for verification (prevents concurrent verify).
   */
  claimForVerification(paymentId: string) {
    return Payment.findOneAndUpdate(
      {
        _id: paymentId,
        status: { $in: ["awaiting_payment", "failed", "processing"] },
      },
      {
        $set: {
          status: "processing",
          lockExpiresAt: new Date(Date.now() + 2 * 60_000),
        },
      },
      { new: true }
    );
  }

  update(id: string, data: Partial<IPayment>) {
    return Payment.findByIdAndUpdate(id, data, { new: true });
  }

  countAttempts(orderId: string) {
    return Payment.countDocuments({ orderId: new Types.ObjectId(orderId) });
  }
}

export const paymentRepository = new PaymentRepository();
