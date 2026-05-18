import { User, type IUser } from "@/lib/db/models";

export class AuthRepository {
  findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findByEmailWithPassword(email: string) {
    return User.findOne({ email: email.toLowerCase() }).select("+password");
  }

  findById(id: string) {
    return User.findById(id);
  }

  create(data: Partial<IUser>) {
    return User.create(data);
  }

  updateById(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true });
  }
}

export const authRepository = new AuthRepository();
