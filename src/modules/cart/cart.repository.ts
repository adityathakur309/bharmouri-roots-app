import { Cart } from "@/lib/db/models";
import { Types } from "mongoose";

export class CartRepository {
  findOrCreate(userId: string) {
    return Cart.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $setOnInsert: { userId: new Types.ObjectId(userId), items: [] } },
      { upsert: true, new: true }
    );
  }
}

export const cartRepository = new CartRepository();
