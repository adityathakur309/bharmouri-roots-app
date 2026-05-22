import { Product } from "@/lib/db/models";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { cartRepository } from "./cart.repository";
import { normalizeProductImages } from "@/lib/utils/image-url";
import { Types } from "mongoose";

const VALID_COUPONS: Record<string, number> = {
  HIMALAYA10: 10,
  BHARMOUR15: 15,
  ORGANIC20: 20,
  WELCOME5: 5,
};

const FREE_SHIPPING_THRESHOLD = 999;
const DEFAULT_SHIPPING = 80;

export class CartService {
  private async getPopulatedCart(userId: string) {
    const cart = await cartRepository.findOrCreate(userId);
    await cart.populate("items.productId");
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getPopulatedCart(userId);
    return this.formatCart(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new NotFoundError("Product not found");
    if (product.stock < quantity) throw new ValidationError("Insufficient stock");

    const cart = await cartRepository.findOrCreate(userId);
    const existing = cart.items.find((i) => i.productId.toString() === productId);

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      existing.quantity = newQty;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(productId),
        quantity,
      });
    }

    await cart.save();
    await cart.populate("items.productId");
    return this.formatCart(cart);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await cartRepository.findOrCreate(userId);

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (!product) throw new NotFoundError("Product not found");
      if (quantity > product.stock) throw new ValidationError("Insufficient stock");

      const item = cart.items.find((i) => i.productId.toString() === productId);
      if (!item) throw new NotFoundError("Item not in cart");
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.productId");
    return this.formatCart(cart);
  }

  async clearCart(userId: string) {
    const cart = await cartRepository.findOrCreate(userId);
    cart.items = [];
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.save();
    return { items: [], subtotal: 0, total: 0, itemCount: 0 };
  }

  async applyCoupon(userId: string, code: string) {
    const discount = VALID_COUPONS[code.toUpperCase()];
    if (!discount) throw new ValidationError("Invalid coupon code");

    const cart = await cartRepository.findOrCreate(userId);
    cart.couponCode = code.toUpperCase();
    cart.couponDiscount = discount;
    await cart.save();
    await cart.populate("items.productId");
    return this.formatCart(cart);
  }

  async removeCoupon(userId: string) {
    const cart = await cartRepository.findOrCreate(userId);
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.save();
    await cart.populate("items.productId");
    return this.formatCart(cart);
  }

  private formatCart(cart: Awaited<ReturnType<typeof cartRepository.findOrCreate>>) {
    const items = cart.items
      .filter((i) => i.productId && typeof i.productId === "object")
      .map((i) => {
        const p = i.productId as unknown as {
          _id: Types.ObjectId;
          name: string;
          slug: string;
          price: number;
          stock: number;
          images: string[];
          category: string;
          categorySlug: string;
          shortDescription: string;
          rating: number;
          reviews: number;
          origin: string;
        };
        return {
          product: {
            id: p._id.toString(),
            name: p.name,
            slug: p.slug,
            price: p.price,
            stock: p.stock,
            images: normalizeProductImages(p.images),
            category: p.category,
            categorySlug: p.categorySlug,
            shortDescription: p.shortDescription,
            rating: p.rating,
            reviews: p.reviews,
            origin: p.origin,
          },
          quantity: i.quantity,
        };
      });

    const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const discountAmount = (subtotal * cart.couponDiscount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const shipping =
      afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : items.length > 0 ? DEFAULT_SHIPPING : 0;

    return {
      items,
      couponCode: cart.couponCode,
      couponDiscount: cart.couponDiscount,
      subtotal,
      discountAmount,
      shipping,
      total: afterDiscount + shipping,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    };
  }
}

export const cartService = new CartService();
