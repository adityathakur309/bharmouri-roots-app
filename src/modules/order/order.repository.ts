import { Order, type IOrder } from "@/lib/db/models";
import { Types } from "mongoose";
import {
  buildEqualityFilter,
  buildSearchFilter,
  buildSort,
  getSkip,
} from "@/lib/utils/query";
import type {
  AdminOrderListQueryInput,
  OrderListQueryInput,
} from "@/lib/validators/order.validator";
import { ADMIN_ORDER_QUEUE_STATUSES } from "@/lib/constants/admin-order-queues";
import type { OrderStatus } from "@/types/order";

const ORDER_SORT_MAP = {
  newest: { createdAt: -1 as const },
  oldest: { createdAt: 1 as const },
};

export class OrderRepository {
  findByUser(userId: string, query: OrderListQueryInput) {
    const filter = {
      userId: new Types.ObjectId(userId),
      ...buildEqualityFilter({ status: query.status }),
      ...buildSearchFilter(query.search, ["orderNumber"]),
    };

    const sort = buildSort(query.sort, ORDER_SORT_MAP);
    const skip = getSkip(query.page, query.limit);

    return Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Order.countDocuments(filter),
    ]);
  }

  findAll(query: AdminOrderListQueryInput) {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(query.search, ["orderNumber"]),
    };

    if (query.status) {
      Object.assign(filter, buildEqualityFilter({ status: query.status }));
    } else if (query.queue && query.queue !== "all") {
      const statuses = ADMIN_ORDER_QUEUE_STATUSES[query.queue] as OrderStatus[];
      filter.status = { $in: statuses };
    }

    const sort = buildSort(query.sort, ORDER_SORT_MAP);
    const skip = getSkip(query.page, query.limit);

    return Promise.all([
      Order.find(filter)
        .populate("userId", "name email")
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
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
