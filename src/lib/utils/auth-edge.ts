import { jwtVerify } from "jose";
import { JWT_ALGORITHM } from "@/lib/constants/jwt";
import type { SessionUser } from "@/types/auth";

export async function verifyAccessTokenEdge(
  token: string
): Promise<SessionUser | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: [JWT_ALGORITHM] }
    );

    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;

    const role = payload.role;
    if (role !== "user" && role !== "admin") return null;

    return {
      id: sub,
      email: String(payload.email ?? ""),
      role,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
