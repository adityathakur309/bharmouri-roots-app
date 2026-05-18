import { Types } from "mongoose";
import { NotFoundError } from "@/lib/utils/errors";
import { sanitizeObject } from "@/lib/utils/sanitize";
import type { AddressInput } from "@/lib/validators/address.validator";
import { addressRepository } from "./address.repository";

function mapAddress(doc: {
  _id: Types.ObjectId;
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  label?: string;
  isDefault: boolean;
}) {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    phone: doc.phone,
    email: doc.email,
    addressLine: doc.addressLine,
    city: doc.city,
    state: doc.state,
    pincode: doc.pincode,
    label: doc.label,
    isDefault: doc.isDefault,
  };
}

export class AddressService {
  async list(userId: string) {
    const addresses = await addressRepository.findByUserId(userId);
    return addresses.map((a) => mapAddress(a));
  }

  async get(userId: string, id: string) {
    const address = await addressRepository.findById(id, userId);
    if (!address) throw new NotFoundError("Address not found");
    return mapAddress(address);
  }

  async create(userId: string, input: AddressInput) {
    const data = sanitizeObject(input);
    if (data.isDefault) await addressRepository.clearDefault(userId);

    const address = await addressRepository.create({
      userId: new Types.ObjectId(userId),
      ...data,
    });
    return mapAddress(address);
  }

  async update(userId: string, id: string, input: Partial<AddressInput>) {
    const data = sanitizeObject(input);
    if (data.isDefault) await addressRepository.clearDefault(userId);

    const address = await addressRepository.update(id, userId, data);
    if (!address) throw new NotFoundError("Address not found");
    return mapAddress(address);
  }

  async remove(userId: string, id: string) {
    const address = await addressRepository.delete(id, userId);
    if (!address) throw new NotFoundError("Address not found");
    return { deleted: true };
  }
}

export const addressService = new AddressService();
