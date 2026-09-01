import { customAlphabet } from "nanoid";
import { Types } from "mongoose";
import { Address } from "@/lib/db/models";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { logger } from "@/lib/utils/logger";
import {
  assertOrderStatusTransition,
  canCreateShipment,
} from "@/lib/utils/order-transitions";
import { buildPaginationMeta } from "@/lib/utils/query";
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderListQueryInput,
  AdminOrderListQueryInput,
} from "@/lib/validators/order.validator";
import { cartService } from "@/modules/cart/cart.service";
import { paymentService } from "@/modules/payment/payment.service";
import { shippingService } from "@/modules/shipping/shipping.service";
import {
  assertStockAvailable,
  decrementStock,
} from "./inventory.service";
import { orderRepository } from "./order.repository";
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
      timestamp: d.createdAt
        ? new Date(d.createdAt as string).toISOString()
        : undefined,
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

  if (d.shiprocketOrderId || d.trackingId || d.shiprocketShipmentId) {
    const est = d.estimatedDelivery
      ? ` · Est. ${String(d.estimatedDelivery)} days`
      : "";
    events.push({
      status: "shipment_created",
      label: "Shipment Created",
      timestamp: d.shippedAt
        ? undefined
        : d.confirmedAt
          ? new Date(d.confirmedAt as string).toISOString()
          : undefined,
      description: d.trackingId
        ? `Tracking ID: ${d.trackingId}${est}`
        : `Shipment booked with courier.${est}`,
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
    user: user ? { name: user.name, email: user.email } : undefined,
    items: d.items,
    shippingAddress: d.shippingAddress,
    status: d.status,
    paymentMethod: d.paymentMethod,
    paymentStatus: d.paymentStatus,
    razorpayOrderId: d.razorpayOrderId,
    invoiceNumber: d.invoiceNumber,
    subtotal: d.subtotal,
    discount: d.discount,
    shippingCharge: d.shippingCharge,
    total: d.total,
    couponCode: d.couponCode,
    courierName: d.courierName,
    awbCode: d.awbCode,
    trackingId: d.trackingId,
    shiprocketOrderId: d.shiprocketOrderId,
    shiprocketShipmentId: d.shiprocketShipmentId,
    estimatedDelivery: d.estimatedDelivery,
    shipmentStatus: d.shipmentStatus,
    shippingProvider: d.shippingProvider,
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

    // Server-side stock + active product validation
    await assertStockAvailable(
      cart.items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        name: i.product.name,
        variantId: (i as { variantId?: string }).variantId,
      }))
    );

    let shippingAddress = input.shippingAddress
      ? sanitizeObject({ ...input.shippingAddress })
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

    if (!shippingAddress?.fullName || !shippingAddress.pincode) {
      throw new ValidationError("Shipping address is required");
    }

    // Optional coupon from request applied on cart before totals (server source of truth)
    if (input.couponCode && input.couponCode !== cart.couponCode) {
      try {
        await cartService.applyCoupon(userId, input.couponCode);
      } catch {
        // Invalid coupon on create — ignore and use cart coupon if any
      }
    }

    const pricedCart = await cartService.getCart(userId);
    if (pricedCart.items.length === 0) {
      throw new ValidationError("Cart is empty");
    }

    // Re-validate coupon at checkout — never trust a stale cart discount
    let validatedCoupon: Awaited<
      ReturnType<typeof import("@/modules/coupon/coupon.service").couponService.validateForUser>
    > | null = null;
    if (pricedCart.couponCode) {
      try {
        const { couponService } = await import("@/modules/coupon/coupon.service");
        validatedCoupon = await couponService.validateForUser(
          pricedCart.couponCode,
          userId
        );
        // Align cart discount % with authoritative coupon record
        if (validatedCoupon.discountPercent !== pricedCart.couponDiscount) {
          await cartService.applyCoupon(userId, validatedCoupon.code);
        }
      } catch {
        await cartService.removeCoupon(userId);
        validatedCoupon = null;
      }
    }

    const finalCart = await cartService.getCart(userId);
    if (finalCart.items.length === 0) {
      throw new ValidationError("Cart is empty");
    }

    if (input.paymentMethod === "cod") {
      const { settingService } = await import("@/modules/settings/setting.service");
      const codGloballyEnabled = await settingService.isCodGloballyEnabled();
      if (!codGloballyEnabled) {
        throw new ValidationError("Cash on Delivery is currently disabled");
      }
      const allAllowCod = finalCart.items.every(
        (i) => Boolean((i.product as { codEnabled?: boolean }).codEnabled)
      );
      if (!allAllowCod) {
        throw new ValidationError(
          "Cash on Delivery is not available for one or more items in your cart"
        );
      }
    }

    // Soft serviceability check (does not block if Shiprocket is down)
    try {
      const serviceable = await shippingService.isServiceable(
        String(shippingAddress.pincode),
        input.paymentMethod === "cod",
        Math.max(0.5, finalCart.itemCount * 0.25)
      );
      if (!serviceable) {
        throw new ValidationError(
          "Delivery is not available for this pincode"
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      logger.warn("Serviceability check skipped due to upstream error", {
        pincode: shippingAddress.pincode,
      });
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${generateOrderNumber()}`;
    const items = finalCart.items.map((i) => {
      const line = i as {
        product: typeof i.product;
        quantity: number;
        variantId?: string;
        variantName?: string;
      };
      return {
        productId: new Types.ObjectId(line.product.id),
        name: line.product.name,
        slug: line.product.slug,
        price: line.product.price,
        quantity: line.quantity,
        image: line.product.images[0] ?? "",
        ...(line.variantId && Types.ObjectId.isValid(line.variantId)
          ? {
              variantId: new Types.ObjectId(line.variantId),
              variantName: line.variantName,
            }
          : {}),
      };
    });

    const isCod = input.paymentMethod === "cod";
    const status: OrderStatus = isCod ? "confirmed" : "payment_pending";

    if (isCod) {
      await decrementStock(
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          name: i.name,
          variantId: i.variantId,
        }))
      );
    }

    const order = await orderRepository.create({
      orderNumber,
      userId: new Types.ObjectId(userId),
      items,
      shippingAddress: shippingAddress as never,
      status,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      subtotal: finalCart.subtotal,
      discount: finalCart.discountAmount,
      shippingCharge: finalCart.shipping,
      total: finalCart.total,
      couponCode: finalCart.couponCode,
      stockDecremented: isCod,
      ...(isCod && { confirmedAt: new Date() }),
    });

    if (isCod) {
      await paymentService.createCodPaymentRecord(order, userId);
    }

    if (validatedCoupon && finalCart.couponCode && finalCart.discountAmount > 0) {
      const { couponService } = await import("@/modules/coupon/coupon.service");
      await couponService.recordRedemption({
        coupon: validatedCoupon,
        userId,
        orderId: String(order._id),
        discountAmount: finalCart.discountAmount,
      });
    }

    await cartService.clearCart(userId);

    logger.info("Order created", {
      orderId: String(order._id),
      orderNumber,
      paymentMethod: input.paymentMethod,
      total: finalCart.total,
    });

    return mapOrder(order.toObject());
  }

  async listByUser(userId: string, query: OrderListQueryInput) {
    const [orders, total] = await orderRepository.findByUser(userId, query);
    return {
      orders: orders.map((o) => mapOrder(o)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listAll(query: AdminOrderListQueryInput) {
    const [orders, total] = await orderRepository.findAll(query);
    return {
      orders: orders.map((o) => mapOrder(o)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string, userId?: string, isAdmin = false) {
    const order =
      userId && !isAdmin
        ? await orderRepository.findByIdAndUser(id, userId)
        : await orderRepository.findById(id);

    if (!order) throw new NotFoundError("Order not found");
    return mapOrder(order);
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await orderRepository.findByIdAndUser(orderId, userId);
    if (!order) throw new NotFoundError("Order not found");

    const intent = await paymentService.createPaymentIntent(order as never, userId);

    await orderRepository.update(orderId, {
      razorpayOrderId: intent.razorpayOrderId,
      status: "payment_pending",
      paymentStatus:
        order.paymentStatus === "failed" ? "pending" : order.paymentStatus,
      activePaymentId: new Types.ObjectId(intent.paymentId),
    });

    // Keep response shape compatible with existing frontend client
    return {
      razorpayOrderId: intent.razorpayOrderId,
      amount: intent.amount,
      currency: intent.currency,
      keyId: intent.keyId,
      orderId: intent.orderId,
      orderNumber: intent.orderNumber,
      isMock: intent.isMock,
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

    const result = await paymentService.verifyPaymentAttempt(
      order as never,
      userId,
      data
    );

    if (result.outcome === "already_paid") {
      const current = await orderRepository.findById(orderId);
      return mapOrder(current!);
    }

    if (result.outcome === "pending") {
      const pending = await orderRepository.update(orderId, {
        paymentStatus: "pending",
        status: "payment_pending",
        razorpayOrderId: data.razorpayOrderId,
      });
      return mapOrder(pending!);
    }

    if (result.outcome === "failed" || result.outcome === "cancelled") {
      // Keep order retryable — do not cancel on transient payment failures
      await orderRepository.update(orderId, {
        paymentStatus: "failed",
        status: "payment_pending",
        razorpayOrderId: data.razorpayOrderId,
      });
      throw new ValidationError(
        result.failureReason ?? "Payment verification failed"
      );
    }

    // outcome === paid
    if (!order.stockDecremented) {
      await decrementStock(
        order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          name: i.name,
          variantId: i.variantId,
        }))
      );
    }

    const updated = await orderRepository.update(orderId, {
      paymentStatus: "paid",
      status: "paid",
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      paidAt: new Date(),
      stockDecremented: true,
      ...(result.paymentId && {
        activePaymentId: new Types.ObjectId(result.paymentId),
      }),
      ...(result.invoiceNumber && { invoiceNumber: result.invoiceNumber }),
    });

    logger.info("Order marked paid", {
      orderId,
      invoiceNumber: result.invoiceNumber,
    });

    return mapOrder(updated!);
  }

  async getTracking(orderId: string, userId?: string, isAdmin = false) {
    const order =
      userId && !isAdmin
        ? await orderRepository.findByIdAndUser(orderId, userId)
        : await orderRepository.findById(orderId);

    if (!order) throw new NotFoundError("Order not found");

    let courierTrack: Array<{
      status: string;
      activity: string;
      location?: string;
      date?: string;
    }> = [];
    if (order.shiprocketShipmentId) {
      try {
        const track = await shippingService.trackShipment(
          order.shiprocketShipmentId
        );
        courierTrack = track.events ?? [];
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

    assertOrderStatusTransition(
      order.status as OrderStatus,
      input.status,
      order.paymentMethod
    );

    // Prepaid: must be paid before admin confirmation
    if (
      input.status === "confirmed" &&
      order.paymentMethod === "razorpay" &&
      order.paymentStatus !== "paid"
    ) {
      throw new ValidationError("Cannot confirm an unpaid order");
    }

    const updates: Record<string, unknown> = {
      status: input.status,
      adminNotes: input.adminNotes,
    };

    if (input.status === "confirmed") updates.confirmedAt = new Date();
    if (input.status === "shipped") updates.shippedAt = new Date();
    if (input.status === "delivered") updates.deliveredAt = new Date();
    if (input.status === "cancelled") {
      updates.cancelledAt = new Date();
      // Restore stock if it was decremented and order not yet shipped
      if (
        order.stockDecremented &&
        !["shipped", "delivered"].includes(order.status)
      ) {
        const { restoreStock } = await import("./inventory.service");
        await restoreStock(
          order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            name: i.name,
            variantId: i.variantId,
          }))
        );
        updates.stockDecremented = false;
      }
      if (order.couponCode) {
        const { couponService } = await import("@/modules/coupon/coupon.service");
        await couponService.restoreRedemptionForOrder(orderId);
      }
    }

    // COD collected when delivered (or admin explicitly confirms payment via markCodPaid)
    if (
      input.status === "delivered" &&
      order.paymentMethod === "cod" &&
      order.paymentStatus !== "paid"
    ) {
      updates.paymentStatus = "paid";
      updates.paidAt = new Date();
      await paymentService.markCodCollected(orderId);
    }

    const updated = await orderRepository.update(orderId, updates);
    return mapOrder(updated!);
  }

  async createShipment(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    if (!canCreateShipment(order.status as OrderStatus)) {
      throw new ValidationError(
        "Order must be confirmed by admin before shipping"
      );
    }

    if (
      order.paymentMethod === "razorpay" &&
      order.paymentStatus !== "paid"
    ) {
      throw new ValidationError("Cannot ship an unpaid order");
    }

    if (order.shiprocketShipmentId && order.awbCode) {
      throw new ConflictError("Shipment already created for this order");
    }

    const booking = await shippingService.createShipmentForOrder(order);

    const updated = await orderRepository.update(orderId, {
      shiprocketOrderId: booking.shiprocketOrderId,
      shiprocketShipmentId: booking.shiprocketShipmentId,
      awbCode: booking.awbCode,
      trackingId: booking.trackingId ?? booking.awbCode,
      courierName: booking.courierName,
      estimatedDelivery: booking.estimatedDelivery,
      shipmentStatus: booking.shipmentStatus,
      shippingProvider: booking.provider,
      ...(typeof booking.shippingCharge === "number" &&
      booking.shippingCharge > 0 &&
      (!order.shippingCharge || order.shippingCharge === 0)
        ? { shippingCharge: booking.shippingCharge }
        : {}),
      status: "processing",
    });

    logger.info("Shipment created", {
      orderId,
      provider: booking.provider,
      shiprocketShipmentId: booking.shiprocketShipmentId,
      awb: booking.awbCode,
    });

    return mapOrder(updated!);
  }

  async markCodPaid(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.paymentMethod !== "cod") {
      throw new ValidationError("Not a COD order");
    }
    if (order.paymentStatus === "paid") {
      return mapOrder(order);
    }

    await paymentService.markCodCollected(orderId);

    const updated = await orderRepository.update(orderId, {
      paymentStatus: "paid",
      paidAt: new Date(),
    });
    return mapOrder(updated!);
  }
}

export const orderService = new OrderService();
