import { Order, type IOrder } from "@/lib/db/models";
import { Types } from "mongoose";
import type { OrderStatus } from "@/types/order";

export class OrderRepository {
  findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return Promise.all([
      Order.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);
  }

  findAll(page = 1, limit = 20, status?: OrderStatus) {
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;
    return Promise.all([
      Order.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
  }

  findById(id: string) {
    return Order.findById(id).populate("userId", "name email").lean();
  }

  findByIdAndUser(id: string, userId: string) {
    return Order.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    }).lean();
  }

  findByOrderNumber(orderNumber: string) {
    return Order.findOne({ orderNumber }).lean();
  }

  create(data: Partial<IOrder>) {
    return Order.create(data);
  }

  update(id: string, data: Partial<IOrder>) {
    return Order.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}

export const orderRepository = new OrderRepository();
