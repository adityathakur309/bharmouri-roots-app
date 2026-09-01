import crypto from "crypto";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRegistrationToken,
  toPublicUser,
  verifyRegistrationToken,
} from "@/lib/utils/auth-helper";
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { sendEmail } from "@/lib/email/email.service";
import {
  completeRegistrationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
} from "@/lib/email/templates";
import { REGISTRATION_TOKEN_EXPIRES_MINUTES } from "@/lib/constants/jwt";
import { getSiteUrl } from "@/lib/seo/config";
import type {
  RegisterInput,
  StartRegistrationInput,
  CompleteRegistrationInput,
  LoginInput,
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

export class AuthService {
  /**
   * Step 1: validate email + send signed complete-registration link.
   * Does not create a user yet.
   */
  async startRegistration(input: StartRegistrationInput) {
    const email = input.email.toLowerCase().trim();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("Email already registered. Please sign in instead.");
    }

    const token = signRegistrationToken(email);
    const completeUrl = `${appBaseUrl()}/complete-registration?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const template = completeRegistrationEmailTemplate({
      email,
      completeUrl,
      expiresMinutes: REGISTRATION_TOKEN_EXPIRES_MINUTES,
    });

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.ok) {
      logger.warn("Registration verification email not delivered", {
        email,
        error: result.error,
        skipped: result.skipped,
      });

      // Email format is already validated — this is a delivery/config failure.
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

    logger.info("Registration verification email sent", { email });
    return {
      message: "Check your email inbox and complete registration.",
      email,
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
        "Invalid or expired registration link. Please start again from Sign up."
      );
    }

    return this.register({
      name: data.name,
      email: verifiedEmail,
      password: data.password,
      phone: data.phone,
    });
  }

  async register(input: RegisterInput) {
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
    });

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    // Best-effort welcome email — never blocks registration
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

    const publicUser = toPublicUser(user);
    const accessToken = signAccessToken({
      id: publicUser.id,
      name: publicUser.name,
      email: publicUser.email,
      role: publicUser.role,
    });

    logger.info("User logged in", { userId: publicUser.id });
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
    await authRepository.clearResetTokenAndSetPassword(
      String(user._id),
      passwordHash
    );

    logger.info("Password reset completed", { userId: String(user._id) });
    return { message: "Password updated successfully. You can sign in now." };
  }
}

export const authService = new AuthService();
