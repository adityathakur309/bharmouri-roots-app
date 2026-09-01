import { Product } from "@/lib/db/models";
import { Types } from "mongoose";
import { ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

export interface StockLine {
  productId: string | Types.ObjectId;
  quantity: number;
  name?: string;
  variantId?: string | Types.ObjectId | null;
}

/**
 * Atomically reserve/decrement stock for each line.
 * When variantId is set, decrements both the variant and base product stock.
 * Rolls back prior decrements if any line fails.
 */
export async function decrementStock(items: StockLine[]): Promise<void> {
  const applied: StockLine[] = [];

  try {
    for (const item of items) {
      const id = item.productId.toString();
      const variantId = item.variantId ? String(item.variantId) : null;

      let updated;
      if (variantId && Types.ObjectId.isValid(variantId)) {
        updated = await Product.findOneAndUpdate(
          {
            _id: id,
            isActive: true,
            variants: {
              $elemMatch: {
                _id: new Types.ObjectId(variantId),
                isActive: { $ne: false },
                stock: { $gte: item.quantity },
              },
            },
          },
          {
            $inc: {
              stock: -item.quantity,
              "variants.$[v].stock": -item.quantity,
            },
          },
          {
            new: true,
            arrayFilters: [{ "v._id": new Types.ObjectId(variantId) }],
          }
        );
      } else {
        updated = await Product.findOneAndUpdate(
          {
            _id: id,
            isActive: true,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

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
    items.map(async (item) => {
      const id = item.productId.toString();
      const variantId = item.variantId ? String(item.variantId) : null;
      if (variantId && Types.ObjectId.isValid(variantId)) {
        await Product.findOneAndUpdate(
          { _id: id },
          {
            $inc: {
              stock: item.quantity,
              "variants.$[v].stock": item.quantity,
            },
          },
          { arrayFilters: [{ "v._id": new Types.ObjectId(variantId) }] }
        );
        return;
      }
      await Product.findByIdAndUpdate(id, {
        $inc: { stock: item.quantity },
      });
    })
  );
}

export async function assertStockAvailable(items: StockLine[]): Promise<void> {
  for (const item of items) {
    const product = await Product.findById(item.productId.toString())
      .select("name stock isActive variants")
      .lean();

    if (!product || !product.isActive) {
      throw new ValidationError(
        `${item.name ?? "Product"} is no longer available`
      );
    }

    const variantId = item.variantId ? String(item.variantId) : null;
    if (variantId) {
      const variant = product.variants?.find(
        (v) => String(v._id) === variantId && v.isActive !== false
      );
      if (!variant) {
        throw new ValidationError(
          `${item.name ?? product.name} variant is no longer available`
        );
      }
      if (variant.stock < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stock}`
        );
      }
      continue;
    }

    if (product.stock < item.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${product.name}. Available: ${product.stock}`
      );
    }
  }
}
