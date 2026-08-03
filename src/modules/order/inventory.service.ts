import { Product } from "@/lib/db/models";
import { Types } from "mongoose";
import { ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

export interface StockLine {
  productId: string | Types.ObjectId;
  quantity: number;
  name?: string;
}

/**
 * Atomically reserve/decrement stock for each line.
 * Rolls back prior decrements if any line fails.
 */
export async function decrementStock(items: StockLine[]): Promise<void> {
  const applied: StockLine[] = [];

  try {
    for (const item of items) {
      const id = item.productId.toString();
      const updated = await Product.findOneAndUpdate(
        {
          _id: id,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        throw new ValidationError(
          `Insufficient stock for ${item.name ?? "product"}`
        );
      }
      applied.push(item);
    }
  } catch (error) {
    if (applied.length > 0) {
      await restoreStock(applied).catch((restoreError) => {
        logger.error("Failed to restore stock after partial decrement", restoreError);
      });
    }
    throw error;
  }
}

export async function restoreStock(items: StockLine[]): Promise<void> {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.productId.toString(), {
        $inc: { stock: item.quantity },
      })
    )
  );
}

export async function assertStockAvailable(items: StockLine[]): Promise<void> {
  for (const item of items) {
    const product = await Product.findById(item.productId.toString())
      .select("name stock isActive")
      .lean();

    if (!product || !product.isActive) {
      throw new ValidationError(
        `${item.name ?? "Product"} is no longer available`
      );
    }
    if (product.stock < item.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${product.name}. Available: ${product.stock}`
      );
    }
  }
}
