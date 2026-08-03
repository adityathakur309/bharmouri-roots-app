import { Wishlist } from "@/lib/db/models";
import { Types } from "mongoose";

export class WishlistRepository {
  findOrCreate(userId: string) {
    return Wishlist.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $setOnInsert: { userId: new Types.ObjectId(userId), productIds: [] } },
      { upsert: true, new: true }
    );
  }
}

export const wishlistRepository = new WishlistRepository();
