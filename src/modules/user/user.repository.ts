import { User } from "@/lib/db/models";

export class UserRepository {
  findAll(page = 1, limit = 20, search?: string) {
    const filter = search
      ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
      : {};

    const skip = (page - 1) * limit;
    return Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
  }

  findById(id: string) {
    return User.findById(id).lean();
  }

  update(id: string, data: Record<string, unknown>) {
    return User.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}

export const userRepository = new UserRepository();
