import { Cart } from "@/lib/db/models";
import { Types } from "mongoose";

export class CartRepository {
  findByUserId(userId: string) {
    return Cart.findOne({ userId: new Types.ObjectId(userId) }).populate("items.productId");
  }

  findOrCreate(userId: string) {
    return Cart.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $setOnInsert: { userId: new Types.ObjectId(userId), items: [] } },
      { upsert: true, new: true }
    );
  }

  save(cart: Awaited<ReturnType<typeof Cart.findOne>>) {
    return cart?.save();
  }
}

export const cartRepository = new CartRepository();
