import { NextResponse } from "next/server";

/** Legacy NextAuth route — app uses JWT at /api/auth/login instead. */
export function GET() {
  return NextResponse.json(
    { success: false, message: "NextAuth is disabled. Use POST /api/auth/login with JWT." },
    { status: 404 }
  );
}

export const POST = GET;
