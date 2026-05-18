import { Address } from "@/lib/db/models";
import { Types } from "mongoose";

export class AddressRepository {
  findByUserId(userId: string) {
    return Address.find({ userId: new Types.ObjectId(userId) }).sort({ isDefault: -1, createdAt: -1 });
  }

  findById(id: string, userId: string) {
    return Address.findOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  create(data: Parameters<typeof Address.create>[0]) {
    return Address.create(data);
  }

  update(id: string, userId: string, data: Record<string, unknown>) {
    return Address.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true }
    );
  }

  delete(id: string, userId: string) {
    return Address.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) });
  }

  clearDefault(userId: string) {
    return Address.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isDefault: false }
    );
  }
}

export const addressRepository = new AddressRepository();
