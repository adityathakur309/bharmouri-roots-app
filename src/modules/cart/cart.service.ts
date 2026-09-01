import { Product } from "@/lib/db/models";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { cartRepository } from "./cart.repository";
import { normalizeProductImages } from "@/lib/utils/image-url";
import { Types } from "mongoose";
import { couponService } from "@/modules/coupon/coupon.service";

const FREE_SHIPPING_THRESHOLD = 999;
const DEFAULT_SHIPPING = 80;

function effectiveVariantPrice(v: {
  price: number;
  salePrice?: number | null;
}): number {
  if (v.salePrice !== undefined && v.salePrice !== null && v.salePrice > 0) {
    return v.salePrice;
  }
  return v.price;
}

function findVariant(
  product: {
    variants?: Array<{
      _id?: Types.ObjectId;
      name: string;
      price: number;
      salePrice?: number;
      stock: number;
      weight?: string;
      isActive?: boolean;
    }>;
  },
  variantId?: string | Types.ObjectId | null
) {
  if (!variantId || !product.variants?.length) return null;
  const id = String(variantId);
  return (
    product.variants.find((v) => String(v._id) === id && v.isActive !== false) ?? null
  );
}

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

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string
  ) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new NotFoundError("Product not found");

    const variant = findVariant(product, variantId);
    if (variantId && !variant) {
      throw new ValidationError("Selected variant is unavailable");
    }

    const available = variant ? variant.stock : product.stock;
    if (available < quantity) throw new ValidationError("Insufficient stock");

    const cart = await cartRepository.findOrCreate(userId);
    const existing = cart.items.find((i) => {
      const sameProduct = i.productId.toString() === productId;
      const sameVariant =
        String(i.variantId ?? "") === String(variantId ?? "");
      return sameProduct && sameVariant;
    });

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, available);
    } else {
      cart.items.push({
        productId: new Types.ObjectId(productId),
        quantity,
        ...(variantId && Types.ObjectId.isValid(variantId)
          ? { variantId: new Types.ObjectId(variantId) }
          : {}),
      });
    }

    await cart.save();
    await cart.populate("items.productId");
    return this.formatCart(cart);
  }

  async updateItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string | null
  ) {
    const cart = await cartRepository.findOrCreate(userId);
    const match = (i: { productId: Types.ObjectId; variantId?: Types.ObjectId }) => {
      const sameProduct = i.productId.toString() === productId;
      const sameVariant =
        String(i.variantId ?? "") === String(variantId ?? "");
      return sameProduct && sameVariant;
    };

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => !match(i));
    } else {
      const product = await Product.findById(productId);
      if (!product) throw new NotFoundError("Product not found");
      const variant = findVariant(product, variantId);
      if (variantId && !variant) {
        throw new ValidationError("Selected variant is unavailable");
      }
      const available = variant ? variant.stock : product.stock;
      if (quantity > available) throw new ValidationError("Insufficient stock");

      const item = cart.items.find((i) => match(i));
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
    const coupon = await couponService.validateForUser(code, userId);

    const cart = await cartRepository.findOrCreate(userId);
    cart.couponCode = coupon.code;
    cart.couponDiscount = coupon.discountPercent;
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
          codEnabled?: boolean;
          variants?: Array<{
            _id: Types.ObjectId;
            name: string;
            price: number;
            salePrice?: number;
            stock: number;
            weight?: string;
            isActive?: boolean;
          }>;
        };

        const variant = findVariant(p, i.variantId);
        const unitPrice = variant
          ? effectiveVariantPrice(variant)
          : p.price;
        const stock = variant ? variant.stock : p.stock;
        const displayName = variant ? `${p.name} (${variant.name})` : p.name;

        return {
          product: {
            id: p._id.toString(),
            name: displayName,
            slug: p.slug,
            price: unitPrice,
            stock,
            images: normalizeProductImages(p.images),
            category: p.category,
            categorySlug: p.categorySlug,
            shortDescription: p.shortDescription,
            rating: p.rating,
            reviews: p.reviews,
            origin: p.origin,
            codEnabled: Boolean(p.codEnabled),
          },
          quantity: i.quantity,
          variantId: i.variantId ? String(i.variantId) : undefined,
          variantName: variant?.name,
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
