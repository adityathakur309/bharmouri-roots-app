import { jwtVerify } from "jose";
import type { SessionUser } from "@/types/auth";

export async function verifyAccessTokenEdge(token: string): Promise<SessionUser | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;

    return {
      id: sub,
      email: String(payload.email ?? ""),
      role: (payload.role as "user" | "admin") ?? "user",
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
