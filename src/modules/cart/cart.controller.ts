import { successResponse } from "@/lib/utils/api-response";
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
} from "@/lib/validators/cart.validator";
import { parseJsonBody, type AuthenticatedRequest } from "@/lib/middleware/with-handler";
import { cartService } from "./cart.service";

export class CartController {
  async get(request: AuthenticatedRequest) {
    const cart = await cartService.getCart(request.user.id);
    return successResponse(cart);
  }

  async addItem(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const { productId, quantity } = addToCartSchema.parse(body);
    const cart = await cartService.addItem(request.user.id, productId, quantity);
    return successResponse(cart, { message: "Added to cart" });
  }

  async updateItem(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const { productId, quantity } = updateCartItemSchema.parse(body);
    const cart = await cartService.updateItem(request.user.id, productId, quantity);
    return successResponse(cart, { message: "Cart updated" });
  }

  async clear(request: AuthenticatedRequest) {
    const cart = await cartService.clearCart(request.user.id);
    return successResponse(cart, { message: "Cart cleared" });
  }

  async applyCoupon(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const { code } = applyCouponSchema.parse(body);
    const cart = await cartService.applyCoupon(request.user.id, code);
    return successResponse(cart, { message: "Coupon applied" });
  }

  async removeCoupon(request: AuthenticatedRequest) {
    const cart = await cartService.removeCoupon(request.user.id);
    return successResponse(cart, { message: "Coupon removed" });
  }
}

export const cartController = new CartController();
