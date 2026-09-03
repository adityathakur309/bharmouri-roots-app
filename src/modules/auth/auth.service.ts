import crypto from "crypto";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRegistrationToken,
  signMfaChallengeToken,
  toPublicUser,
  verifyRegistrationToken,
  verifyMfaChallengeToken,
} from "@/lib/utils/auth-helper";
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { sendEmail } from "@/lib/email/email.service";
import {
  emailOtpTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
} from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/seo/config";
import {
  generateOtpCode,
  hashOtpCode,
  maskEmail,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
} from "@/lib/auth/otp";
import { EmailOtp, type EmailOtpPurpose } from "@/lib/db/models";
import type {
  RegisterInput,
  StartRegistrationInput,
  CompleteRegistrationInput,
  VerifyRegistrationOtpInput,
  LoginInput,
  VerifyLoginOtpInput,
  UpdateProfileInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validators/auth.validator";
import { authRepository } from "./auth.repository";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function appBaseUrl(): string {
  try {
    return getSiteUrl();
  } catch {
    return (
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
      "http://localhost:3000"
    );
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function throwEmailDeliveryError(result: { error?: string; skipped?: boolean }) {
  if (result.skipped || /not configured/i.test(result.error || "")) {
    throw new ValidationError(
      "Email service is not configured. Please try again later."
    );
  }
  if (/invalid login|badcredentials|username and password/i.test(result.error || "")) {
    throw new ValidationError(
      "Could not send verification email (mail login failed). Please try again later."
    );
  }
  throw new ValidationError(
    "Could not send verification email. Please try again in a moment."
  );
}

export class AuthService {
  private async issueEmailOtp(params: {
    email: string;
    purpose: EmailOtpPurpose;
    purposeLabel: string;
    userId?: string;
  }) {
    const email = params.email.toLowerCase().trim();
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await EmailOtp.deleteMany({ email, purpose: params.purpose });
    await EmailOtp.create({
      email,
      purpose: params.purpose,
      codeHash,
      expiresAt,
      attempts: 0,
      userId: params.userId,
    });

    const template = emailOtpTemplate({
      code,
      purposeLabel: params.purposeLabel,
      expiresMinutes: Math.round(OTP_TTL_MS / 60_000),
    });

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.ok) {
      logger.warn("OTP email not delivered", {
        email,
        purpose: params.purpose,
        error: result.error,
        skipped: result.skipped,
      });
      throwEmailDeliveryError(result);
    }

    logger.info("OTP email sent", { email, purpose: params.purpose });
    return { email, maskedEmail: maskEmail(email), expiresAt };
  }

  private async consumeEmailOtp(
    email: string,
    purpose: EmailOtpPurpose,
    code: string
  ) {
    const normalized = email.toLowerCase().trim();
    const doc = await EmailOtp.findOne({ email: normalized, purpose }).select(
      "+codeHash"
    );
    if (!doc || doc.expiresAt.getTime() < Date.now()) {
      throw new ValidationError("Invalid or expired verification code");
    }
    if (doc.attempts >= OTP_MAX_ATTEMPTS) {
      await EmailOtp.deleteMany({ email: normalized, purpose });
      throw new ValidationError("Too many attempts. Please request a new code.");
    }

    const ok = doc.codeHash === hashOtpCode(code);
    if (!ok) {
      doc.attempts += 1;
      await doc.save();
      throw new ValidationError("Invalid or expired verification code");
    }

    await EmailOtp.deleteMany({ email: normalized, purpose });
    return doc;
  }

  /**
   * Step 1: validate email + send OTP for registration.
   * Does not create a user yet.
   */
  async startRegistration(input: StartRegistrationInput) {
    const email = input.email.toLowerCase().trim();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("Email already registered. Please sign in instead.");
    }

    const issued = await this.issueEmailOtp({
      email,
      purpose: "registration",
      purposeLabel: "Verify your email",
    });

    return {
      message: "We sent a 6-digit verification code to your email.",
      email: issued.email,
      maskedEmail: issued.maskedEmail,
    };
  }

  /** Step 1b: verify registration OTP → signed complete-registration token */
  async verifyRegistrationOtp(input: VerifyRegistrationOtpInput) {
    const email = input.email.toLowerCase().trim();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("Email already registered. Please sign in instead.");
    }

    await this.consumeEmailOtp(email, "registration", input.code);
    const token = signRegistrationToken(email);

    return {
      message: "Email verified. Complete your account setup.",
      email,
      token,
    };
  }

  /**
   * Step 2: verify signed email token, then create the account.
   * Preserves ADMIN_EMAIL bootstrap role assignment.
   */
  async completeRegistration(input: CompleteRegistrationInput) {
    const data = sanitizeObject(input);
    const email = data.email.toLowerCase().trim();
    const verifiedEmail = verifyRegistrationToken(data.token, email);

    if (!verifiedEmail) {
      throw new ValidationError(
        "Invalid or expired registration session. Please start again from Sign up."
      );
    }

    return this.register({
      name: data.name,
      email: verifiedEmail,
      password: data.password,
      phone: data.phone,
      mfaEnabled: data.mfaEnabled,
    });
  }

  async register(input: RegisterInput & { mfaEnabled?: boolean }) {
    const data = sanitizeObject(input);
    const existing = await authRepository.findByEmail(data.email);
    if (existing) throw new ConflictError("Email already registered");

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const hashed = await hashPassword(data.password);
    const isBootstrapAdmin = Boolean(
      adminEmail && data.email.toLowerCase() === adminEmail
    );

    if (isBootstrapAdmin) {
      logger.info("Creating bootstrap admin user via ADMIN_EMAIL match");
    }

    const user = await authRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      phone: data.phone,
      role: isBootstrapAdmin ? "admin" : "user",
      emailVerified: new Date(),
      mfaEnabled: Boolean(data.mfaEnabled),
    });

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    const welcome = welcomeEmailTemplate({
      name: publicUser.name,
      shopUrl: `${appBaseUrl()}/products`,
    });
    void sendEmail({
      to: publicUser.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    });

    return { user: publicUser, accessToken };
  }

  async loginWithGoogle(profile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email?: boolean;
  }) {
    const email = profile.email.toLowerCase().trim();
    if (!email) throw new ValidationError("Google account email is required");

    let user =
      (await authRepository.findByGoogleId(profile.id)) ??
      (await authRepository.findByEmail(email));

    if (user && !user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    if (!user) {
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      const isBootstrapAdmin = Boolean(adminEmail && email === adminEmail);

      user = await authRepository.create({
        name: profile.name?.trim() || email.split("@")[0],
        email,
        googleId: profile.id,
        avatar: profile.picture,
        role: isBootstrapAdmin ? "admin" : "user",
        emailVerified: profile.verified_email ? new Date() : new Date(),
        mfaEnabled: false,
      });
      logger.info("User created via Google OAuth", { email });
    } else {
      const updates: Record<string, unknown> = {};
      if (!user.googleId) updates.googleId = profile.id;
      if (profile.picture && !user.avatar) updates.avatar = profile.picture;
      if (!user.emailVerified) updates.emailVerified = new Date();
      if (Object.keys(updates).length) {
        user = (await authRepository.updateById(String(user._id), updates)) ?? user;
      }
    }

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    logger.info("User logged in via Google", { userId: publicUser.id });
    return { user: publicUser, accessToken };
  }

  async login(input: LoginInput) {
    const user = await authRepository.findByEmailWithPassword(input.email.toLowerCase());
    if (!user) {
      logger.warn("Login failed: unknown email", { email: input.email.toLowerCase() });
      throw new UnauthorizedError("Invalid email or password");
    }
    if (!user.password) {
      throw new UnauthorizedError("This account uses Google sign-in. Please continue with Google.");
    }

    if (!user.isActive) {
      logger.warn("Login failed: inactive account", { userId: String(user._id) });
      throw new UnauthorizedError("Account is deactivated");
    }

    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      logger.warn("Login failed: bad password", { userId: String(user._id) });
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.mfaEnabled) {
      const issued = await this.issueEmailOtp({
        email: user.email,
        purpose: "login_mfa",
        purposeLabel: "Your login verification code",
        userId: String(user._id),
      });
      const mfaToken = signMfaChallengeToken(String(user._id), user.email);
      logger.info("MFA challenge issued", { userId: String(user._id) });
      return {
        requiresMfa: true as const,
        mfaToken,
        email: issued.email,
        maskedEmail: issued.maskedEmail,
        message: "Enter the verification code we emailed you.",
      };
    }

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    logger.info("User logged in", { userId: publicUser.id });
    return { requiresMfa: false as const, user: publicUser, accessToken };
  }

  async verifyLoginOtp(input: VerifyLoginOtpInput) {
    const challenge = verifyMfaChallengeToken(input.mfaToken);
    if (!challenge) {
      throw new ValidationError("Verification session expired. Please sign in again.");
    }

    await this.consumeEmailOtp(challenge.email, "login_mfa", input.code);

    const user = await authRepository.findById(challenge.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }
    if (user.email.toLowerCase() !== challenge.email) {
      throw new ValidationError("Verification session expired. Please sign in again.");
    }

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    logger.info("User logged in via MFA", { userId: publicUser.id });
    return { user: publicUser, accessToken };
  }

  async getProfile(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (!user.isActive) throw new UnauthorizedError("Account is deactivated");
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data = sanitizeObject(input);
    const user = await authRepository.updateById(userId, data);
    if (!user) throw new NotFoundError("User not found");
    return toPublicUser(user);
  }

  /**
   * Always returns the same generic message to prevent email enumeration.
   */
  async forgotPassword(input: ForgotPasswordInput) {
    const email = input.email.toLowerCase().trim();
    const user = await authRepository.findByEmail(email);

    if (user?.isActive) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await authRepository.setResetToken(String(user._id), tokenHash, expires);

      const resetUrl = `${appBaseUrl()}/reset-password?token=${rawToken}`;
      const template = passwordResetEmailTemplate({
        name: user.name,
        resetUrl,
        expiresMinutes: 60,
      });

      const result = await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (!result.ok) {
        logger.warn("Password reset email not delivered", {
          userId: String(user._id),
          error: result.error,
          skipped: result.skipped,
        });
      }
    } else {
      logger.info("Password reset requested for unknown/inactive email");
    }

    return {
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = hashToken(input.token);
    const user = await authRepository.findByResetToken(tokenHash);
    if (!user) {
      throw new ValidationError("Invalid or expired reset link");
    }

    const passwordHash = await hashPassword(input.password);
    await authRepository.clearResetTokenAndSetPassword(String(user._id), passwordHash);
    logger.info("Password reset successful", { userId: String(user._id) });
    return { message: "Password updated. You can sign in now." };
  }
}

export const authService = new AuthService();
