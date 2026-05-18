import { Product } from "@/lib/db/models";
import { NotFoundError } from "@/lib/utils/errors";
import { wishlistRepository } from "./wishlist.repository";
import { Types } from "mongoose";

export class WishlistService {
  async get(userId: string) {
    const wishlist = await wishlistRepository.findOrCreate(userId);
    await wishlist.populate("productIds");
    const products = (wishlist.productIds as unknown as Array<{
      _id: Types.ObjectId;
      name: string;
      slug: string;
      price: number;
      images: string[];
      stock: number;
      rating: number;
    }>).filter(Boolean);

    return products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      images: p.images,
      stock: p.stock,
      rating: p.rating,
    }));
  }

  async toggle(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("Product not found");

    const wishlist = await wishlistRepository.findOrCreate(userId);
    const oid = new Types.ObjectId(productId);
    const index = wishlist.productIds.findIndex((id) => id.equals(oid));

    if (index >= 0) {
      wishlist.productIds.splice(index, 1);
      await wishlist.save();
      return { added: false, productIds: wishlist.productIds.map((id) => id.toString()) };
    }

    wishlist.productIds.push(oid);
    await wishlist.save();
    return { added: true, productIds: wishlist.productIds.map((id) => id.toString()) };
  }
}

export const wishlistService = new WishlistService();
