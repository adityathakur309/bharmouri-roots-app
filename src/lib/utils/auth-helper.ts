import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
  MFA_CHALLENGE_EXPIRES_IN,
  MFA_CHALLENGE_PURPOSE,
  REGISTRATION_TOKEN_EXPIRES_IN,
  REGISTRATION_TOKEN_PURPOSE,
} from "@/lib/constants/jwt";
import type { SessionUser } from "@/types/auth";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(user: SessionUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    secret,
    {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: JWT_ALGORITHM,
    }
  );
}

export function verifyAccessToken(token: string): SessionUser | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as {
      sub: string;
      email: string;
      role: "user" | "admin";
      name: string;
    };

    if (!payload.sub || !payload.email || !payload.role) return null;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/** Signed one-hour token proving ownership of an email for registration. */
export function signRegistrationToken(email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  return jwt.sign(
    {
      purpose: REGISTRATION_TOKEN_PURPOSE,
      email: email.toLowerCase().trim(),
    },
    secret,
    {
      expiresIn: REGISTRATION_TOKEN_EXPIRES_IN,
      algorithm: JWT_ALGORITHM,
    }
  );
}

/** Returns verified email or null if token invalid/expired/mismatched. */
export function verifyRegistrationToken(
  token: string,
  expectedEmail?: string
): string | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as {
      purpose?: string;
      email?: string;
    };

    if (payload.purpose !== REGISTRATION_TOKEN_PURPOSE || !payload.email) {
      return null;
    }

    const email = payload.email.toLowerCase().trim();
    if (expectedEmail && email !== expectedEmail.toLowerCase().trim()) {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}

/** Short-lived token proving password was verified; used for MFA OTP step. */
export function signMfaChallengeToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  return jwt.sign(
    {
      purpose: MFA_CHALLENGE_PURPOSE,
      sub: userId,
      email: email.toLowerCase().trim(),
    },
    secret,
    {
      expiresIn: MFA_CHALLENGE_EXPIRES_IN,
      algorithm: JWT_ALGORITHM,
    }
  );
}

export function verifyMfaChallengeToken(
  token: string
): { userId: string; email: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as {
      purpose?: string;
      sub?: string;
      email?: string;
    };

    if (payload.purpose !== MFA_CHALLENGE_PURPOSE || !payload.sub || !payload.email) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email.toLowerCase().trim(),
    };
  } catch {
    return null;
  }
}

export function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  mfaEnabled?: boolean;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    mfaEnabled: Boolean(user.mfaEnabled),
  };
}
