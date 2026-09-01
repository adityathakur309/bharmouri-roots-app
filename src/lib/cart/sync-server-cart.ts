import { cartApi } from "@/services/api";
import { useCartStore } from "@/stores/cart-store";
import { isValidMongoId } from "@/lib/utils/mongo-id";
import type { Product } from "@/types/product";

export function getLocalCartItems() {
  return useCartStore.getState().items;
}

/** Push persisted local cart lines to the user's server cart (logged-in checkout). */
export async function pushLocalCartToServer(): Promise<{
  synced: number;
  skipped: number;
}> {
  const items = getLocalCartItems();
  let synced = 0;
  let skipped = 0;

  for (const item of items) {
    if (!isValidMongoId(item.product.id)) {
      skipped += item.quantity;
      continue;
    }
    try {
      await cartApi.addItem(item.product.id, item.quantity, item.variantId);
      synced += item.quantity;
    } catch {
      skipped += item.quantity;
    }
  }

  if (synced > 0) {
    const res = await cartApi.get();
    const data = res.data as {
      items: { product: Product; quantity: number }[];
      couponCode?: string;
      couponDiscount?: number;
    };
    useCartStore.getState().setFromServer({
      items: data.items ?? [],
      couponCode: data.couponCode ?? "",
      couponDiscount: data.couponDiscount ?? 0,
    });
  }

  return { synced, skipped };
}
