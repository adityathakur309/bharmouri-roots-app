import { User, type IUser } from "@/lib/db/models";

export class AuthRepository {
  findByGoogleId(googleId: string) {
    return User.findOne({ googleId });
  }

  findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findByEmailWithPassword(email: string) {
    return User.findOne({ email: email.toLowerCase() }).select("+password");
  }

  findById(id: string) {
    return User.findById(id);
  }

  findByResetToken(tokenHash: string) {
    return User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");
  }

  create(data: Partial<IUser>) {
    return User.create(data);
  }

  updateById(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  setResetToken(userId: string, tokenHash: string, expires: Date) {
    return User.findByIdAndUpdate(userId, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
    });
  }

  clearResetTokenAndSetPassword(userId: string, passwordHash: string) {
    return User.findByIdAndUpdate(userId, {
      $set: { password: passwordHash },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    });
  }
}

export const authRepository = new AuthRepository();
