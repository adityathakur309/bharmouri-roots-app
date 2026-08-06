import type { CartItem } from "@/stores/cart-store";
import type { Product } from "@/types/product";

const STORAGE_KEY = "bharmouri_buy_now";

export interface BuyNowIntent {
  product: Product;
  quantity: number;
  /** Cart state before Buy Now — restored if checkout is abandoned */
  snapshot: {
    items: CartItem[];
    couponCode: string;
    couponDiscount: number;
  };
}

export function saveBuyNowIntent(intent: BuyNowIntent) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getBuyNowIntent(): BuyNowIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuyNowIntent;
    if (!parsed?.product?.id || !parsed.quantity) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBuyNowIntent() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isBuyNowActive() {
  return getBuyNowIntent() !== null;
}
