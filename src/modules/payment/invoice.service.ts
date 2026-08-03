import { customAlphabet } from "nanoid";
import { Invoice } from "@/lib/db/models/invoice.model";
import { Types } from "mongoose";
import { logger } from "@/lib/utils/logger";

const generateInvoiceSuffix = customAlphabet("0123456789", 8);

export class InvoiceService {
  async createForOrder(input: {
    orderId: string;
    paymentId: string;
    userId: string;
    orderNumber: string;
    amount: number;
    subtotal: number;
    discount: number;
    shippingCharge: number;
    items: Array<{
      name: string;
      slug: string;
      quantity: number;
      price: number;
    }>;
    billingAddress: {
      fullName: string;
      phone: string;
      email: string;
      addressLine: string;
      city: string;
      state: string;
      pincode: string;
    };
  }) {
    const existing = await Invoice.findOne({
      orderId: new Types.ObjectId(input.orderId),
    }).lean();

    if (existing) {
      return existing;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${generateInvoiceSuffix()}`;

    try {
      const invoice = await Invoice.create({
        invoiceNumber,
        orderId: new Types.ObjectId(input.orderId),
        paymentId: new Types.ObjectId(input.paymentId),
        userId: new Types.ObjectId(input.userId),
        orderNumber: input.orderNumber,
        amount: input.amount,
        currency: "INR",
        subtotal: input.subtotal,
        discount: input.discount,
        shippingCharge: input.shippingCharge,
        items: input.items.map((i) => ({
          name: i.name,
          slug: i.slug,
          quantity: i.quantity,
          unitPrice: i.price,
          lineTotal: i.price * i.quantity,
        })),
        billingAddress: input.billingAddress,
        status: "issued",
        issuedAt: new Date(),
      });

      logger.info("Invoice issued", {
        invoiceNumber,
        orderId: input.orderId,
      });

      return invoice.toObject();
    } catch (error) {
      // Race: another verify created the invoice
      const raced = await Invoice.findOne({
        orderId: new Types.ObjectId(input.orderId),
      }).lean();
      if (raced) return raced;
      throw error;
    }
  }

  async getByOrderId(orderId: string) {
    return Invoice.findOne({ orderId: new Types.ObjectId(orderId) }).lean();
  }
}

export const invoiceService = new InvoiceService();
