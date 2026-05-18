import { successResponse } from "@/lib/utils/api-response";
import { addressSchema } from "@/lib/validators/address.validator";
import {
  parseJsonBody,
  type AuthenticatedRequest,
  type RouteContext,
} from "@/lib/middleware/with-handler";
import { addressService } from "./address.service";

export class AddressController {
  async list(request: AuthenticatedRequest) {
    const addresses = await addressService.list(request.user.id);
    return successResponse(addresses);
  }

  async create(request: AuthenticatedRequest) {
    const body = await parseJsonBody(request);
    const input = addressSchema.parse(body);
    const address = await addressService.create(request.user.id, input);
    return successResponse(address, { message: "Address saved", status: 201 });
  }

  async update(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = addressSchema.partial().parse(body);
    const address = await addressService.update(request.user.id, id, input);
    return successResponse(address, { message: "Address updated" });
  }

  async remove(request: AuthenticatedRequest, context: RouteContext) {
    const { id } = await context.params;
    await addressService.remove(request.user.id, id);
    return successResponse({ deleted: true }, { message: "Address deleted" });
  }
}

export const addressController = new AddressController();
