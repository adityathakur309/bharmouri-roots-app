import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import mongoose from "mongoose";

/** Lightweight readiness probe for load balancers / uptime checks. */
export async function GET() {
  try {
    await connectDB();
    const dbOk = mongoose.connection.readyState === 1;
    if (!dbOk) {
      return NextResponse.json(
        { ok: false, status: "degraded", db: "disconnected" },
        { status: 503 }
      );
    }
    return NextResponse.json({
      ok: true,
      status: "healthy",
      db: "connected",
      time: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 }
    );
  }
}
