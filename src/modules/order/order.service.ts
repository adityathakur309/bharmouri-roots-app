import { customAlphabet } from "nanoid";
import { Types } from "mongoose";
import { Address } from "@/lib/db/models";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type { CreateOrderInput, UpdateOrderStatusInput } from "@/lib/validators/order.validator";
import { cartService } from "@/modules/cart/cart.service";
import { orderRepository } from "./order.repository";
import { razorpayClient } from "@/modules/payment/razorpay.client";
import { mockPaymentClient } from "@/modules/payment/mock-payment.client";
import { shiprocketClient } from "@/modules/shipping/shiprocket.client";
import type { OrderStatus } from "@/types/order";

export interface ShipmentTimelineEvent {
  status: string;
  label: string;
  timestamp?: string;
  description?: string;
}

function buildShipmentTimeline(d: Record<string, unknown>): ShipmentTimelineEvent[] {
  const events: ShipmentTimelineEvent[] = [
    {
      status: "placed",
      label: "Order Placed",
      timestamp: d.createdAt ? new Date(d.createdAt as string).toISOString() : undefined,
      description: "Your order has been received.",
    },
  ];

  if (d.paidAt) {
    events.push({
      status: "paid",
      label: "Payment Confirmed",
      timestamp: new Date(d.paidAt as string).toISOString(),
      description: "Payment received successfully.",
    });
  }

  if (d.confirmedAt) {
    events.push({
      status: "confirmed",
      label: "Order Confirmed",
      timestamp: new Date(d.confirmedAt as string).toISOString(),
      description: "Seller confirmed your order.",
    });
  }

  if (d.shiprocketOrderId || d.trackingId) {
    events.push({
      status: "shipment_created",
      label: "Shipment Created",
      timestamp: d.confirmedAt
        ? new Date(d.confirmedAt as string).toISOString()
        : undefined,
      description: d.trackingId
        ? `Tracking ID: ${d.trackingId}`
        : "Shipment booked with courier.",
    });
  }

  if (d.shippedAt) {
    events.push({
      status: "shipped",
      label: "Shipped",
      timestamp: new Date(d.shippedAt as string).toISOString(),
      description: d.courierName
        ? `Handed to ${d.courierName}`
        : "Package is on the way.",
    });
  }

  if (d.deliveredAt) {
    events.push({
      status: "delivered",
      label: "Delivered",
      timestamp: new Date(d.deliveredAt as string).toISOString(),
      description: "Package delivered successfully.",
    });
  }

  if (d.status === "cancelled") {
    events.push({
      status: "cancelled",
      label: "Cancelled",
      timestamp: d.cancelledAt
        ? new Date(d.cancelledAt as string).toISOString()
        : undefined,
      description: "Order was cancelled.",
    });
  }

  return events;
}

const generateOrderNumber = customAlphabet("0123456789", 8);

function mapOrder(doc: Record<string, unknown> | object) {
  const d = doc as Record<string, unknown>;
  const user = d.userId as Record<string, unknown> | undefined;
  return {
    id: String(d._id),
    orderNumber: d.orderNumber,
    userId: user?._id ? String(user._id) : String(d.userId),
    user: user
      ? { name: user.name, email: user.email }
      : undefined,
    items: d.items,
    shippingAddress: d.shippingAddress,
    status: d.status,
    paymentMethod: d.paymentMethod,
    paymentStatus: d.paymentStatus,
    razorpayOrderId: d.razorpayOrderId,
    subtotal: d.subtotal,
    discount: d.discount,
    shippingCharge: d.shippingCharge,
    total: d.total,
    couponCode: d.couponCode,
    courierName: d.courierName,
    awbCode: d.awbCode,
    trackingId: d.trackingId,
    shiprocketOrderId: d.shiprocketOrderId,
    adminNotes: d.adminNotes,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    paidAt: d.paidAt,
    confirmedAt: d.confirmedAt,
    shippedAt: d.shippedAt,
    deliveredAt: d.deliveredAt,
    cancelledAt: d.cancelledAt,
    shipmentTimeline: buildShipmentTimeline(d),
  };
}

export class OrderService {
  async create(userId: string, input: CreateOrderInput) {
    const cart = await cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new ValidationError("Cart is empty");
    }

    let shippingAddress = input.shippingAddress
      ? sanitizeObject(input.shippingAddress)
      : undefined;

    if (input.addressId) {
      const addr = await Address.findOne({
        _id: input.addressId,
        userId: new Types.ObjectId(userId),
      });
      if (!addr) throw new NotFoundError("Address not found");
      shippingAddress = {
        fullName: addr.fullName,
        phone: addr.phone,
        email: addr.email,
        addressLine: addr.addressLine,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
      };
    }

    if (!shippingAddress) {
      throw new ValidationError("Shipping address is required");
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${generateOrderNumber()}`;
    const items = cart.items.map((i) => ({
      productId: new Types.ObjectId(i.product.id),
      name: i.product.name,
      slug: i.product.slug,
      price: i.product.price,
      quantity: i.quantity,
      image: i.product.images[0] ?? "",
    }));

    const isCod = input.paymentMethod === "cod";
    const status: OrderStatus = isCod ? "confirmed" : "payment_pending";
    const paymentStatus = isCod ? "pending" : "pending";

    const order = await orderRepository.create({
      orderNumber,
      userId: new Types.ObjectId(userId),
      items,
      shippingAddress,
      status,
      paymentMethod: input.paymentMethod,
      paymentStatus: isCod ? "pending" : "pending",
      subtotal: cart.subtotal,
      discount: cart.discountAmount,
      shippingCharge: cart.shipping,
      total: cart.total,
      couponCode: cart.couponCode,
      ...(isCod && { confirmedAt: new Date() }),
    });

    await cartService.clearCart(userId);

    return mapOrder(order.toObject());
  }

  async listByUser(userId: string, page = 1, limit = 10) {
    const [orders, total] = await orderRepository.findByUser(userId, page, limit);
    return {
      orders: orders.map((o) => mapOrder(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listAll(page = 1, limit = 20, status?: OrderStatus) {
    const [orders, total] = await orderRepository.findAll(page, limit, status);
    return {
      orders: orders.map((o) => mapOrder(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string, userId?: string, isAdmin = false) {
    const order = userId && !isAdmin
      ? await orderRepository.findByIdAndUser(id, userId)
      : await orderRepository.findById(id);

    if (!order) throw new NotFoundError("Order not found");
    return mapOrder(order);
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.paymentMethod !== "razorpay") {
      throw new ValidationError("Order is not a Razorpay payment order");
    }
    if (order.paymentStatus === "paid") {
      throw new ValidationError("Order already paid");
    }

    const amountPaise = Math.round(order.total * 100);
    const razorpayOrder = await razorpayClient.createOrder(
      amountPaise,
      order.orderNumber,
      { orderId: String(order._id) }
    );

    await orderRepository.update(String(order._id), {
      razorpayOrderId: razorpayOrder.id,
      status: "payment_pending",
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: "INR",
      keyId: razorpayClient.getKeyId(),
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      isMock: razorpayClient.isMockMode(),
    };
  }

  async verifyPayment(
    orderId: string,
    userId: string,
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      mockOutcome?: "success" | "failed" | "pending";
    }
  ) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) throw new NotFoundError("Order not found");

    if (razorpayClient.isMockMode() && data.mockOutcome) {
      if (data.mockOutcome === "pending") {
        const pending = await orderRepository.update(orderId, {
          paymentStatus: "pending",
          status: "payment_pending",
          razorpayOrderId: data.razorpayOrderId,
        });
        return mapOrder(pending!);
      }

      if (data.mockOutcome === "failed") {
        await orderRepository.update(orderId, {
          paymentStatus: "failed",
          status: "cancelled",
          cancelledAt: new Date(),
          razorpayOrderId: data.razorpayOrderId,
        });
        throw new ValidationError("Payment failed (demo)");
      }
    }

    const valid = razorpayClient.verifySignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature
    );

    if (!valid) {
      await orderRepository.update(orderId, {
        paymentStatus: "failed",
        status: "cancelled",
        cancelledAt: new Date(),
      });
      throw new ValidationError("Invalid payment signature");
    }

    if (
      razorpayClient.isMockMode() &&
      mockPaymentClient.outcomeFromPaymentId(data.razorpayPaymentId) === "failed"
    ) {
      await orderRepository.update(orderId, {
        paymentStatus: "failed",
        status: "cancelled",
        cancelledAt: new Date(),
      });
      throw new ValidationError("Payment failed (demo)");
    }

    const updated = await orderRepository.update(orderId, {
      paymentStatus: "paid",
      status: "paid",
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      paidAt: new Date(),
      confirmedAt: new Date(),
    });

    return mapOrder(updated!);
  }

  async getTracking(orderId: string, userId?: string, isAdmin = false) {
    const order =
      userId && !isAdmin
        ? await orderRepository.findByIdAndUser(orderId, userId)
        : await orderRepository.findById(orderId);

    if (!order) throw new NotFoundError("Order not found");

    let courierTrack: unknown[] = [];
    if (order.shiprocketShipmentId) {
      try {
        const track = await shiprocketClient.trackShipment(order.shiprocketShipmentId);
        courierTrack =
          (track as { tracking_data?: { shipment_track?: unknown[] } })?.tracking_data
            ?.shipment_track ?? [];
      } catch {
        courierTrack = [];
      }
    }

    return {
      order: mapOrder(order),
      courierTrack,
    };
  }

  async updateStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    const updates: Record<string, unknown> = {
      status: input.status,
      adminNotes: input.adminNotes,
    };

    if (input.status === "confirmed") updates.confirmedAt = new Date();
    if (input.status === "shipped") updates.shippedAt = new Date();
    if (input.status === "delivered") updates.deliveredAt = new Date();
    if (input.status === "cancelled") updates.cancelledAt = new Date();

    if (input.status === "confirmed" && order.paymentMethod === "cod") {
      updates.paymentStatus = "pending";
    }

    const updated = await orderRepository.update(orderId, updates);
    return mapOrder(updated!);
  }

  async createShipment(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    if (!["confirmed", "processing", "paid"].includes(order.status)) {
      throw new ValidationError("Order must be confirmed before shipping");
    }

    const addr = order.shippingAddress;
    const payload = {
      order_id: order.orderNumber,
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
      billing_customer_name: addr.fullName,
      billing_last_name: "",
      billing_address: addr.addressLine,
      billing_city: addr.city,
      billing_pincode: addr.pincode,
      billing_state: addr.state,
      billing_country: "India",
      billing_email: addr.email,
      billing_phone: addr.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.name,
        sku: item.slug,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const result = await shiprocketClient.createOrder(payload);
    const shiprocketOrderId = String(result.order_id ?? result.shipment_id ?? "");
    const awb = result.awb_code ?? result.awb;

    const updated = await orderRepository.update(orderId, {
      shiprocketOrderId,
      shiprocketShipmentId: String(result.shipment_id ?? ""),
      awbCode: awb,
      trackingId: awb ?? result.tracking_id,
      courierName: result.courier_name,
      status: "processing",
    });

    return mapOrder(updated!);
  }

  async markCodPaid(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.paymentMethod !== "cod") {
      throw new ValidationError("Not a COD order");
    }

    const updated = await orderRepository.update(orderId, {
      paymentStatus: "paid",
      paidAt: new Date(),
    });
    return mapOrder(updated!);
  }
}

export const orderService = new OrderService();
