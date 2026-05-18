import { successResponse } from "@/lib/utils/api-response";
import {
  serviceabilitySchema,
  shippingEstimateSchema,
} from "@/lib/validators/shipping.validator";
import { NextRequest } from "next/server";
import { shippingService } from "./shipping.service";

export class ShippingController {
  async serviceability(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const input = serviceabilitySchema.parse(Object.fromEntries(searchParams));
    const result = await shippingService.checkServiceability(input);
    return successResponse(result);
  }

  async estimate(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const input = shippingEstimateSchema.parse(Object.fromEntries(searchParams));
    const result = await shippingService.estimateShipping(input);
    return successResponse(result);
  }
}

export const shippingController = new ShippingController();
