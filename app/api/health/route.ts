import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Health check endpoint.
 * GET /api/health -> { ok, db: { connected, name, host, latencyMs } }
 *
 * Use this to confirm the app can reach MongoDB. Returns 503 if the
 * driver can't open a connection.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const conn = await connectToDatabase();
    // Lightweight round-trip: ask the server for a ping.
    await conn.connection.db?.admin().ping();

    return NextResponse.json({
      ok: true,
      db: {
        connected: mongoose.connection.readyState === 1,
        name: conn.connection.name,
        host: conn.connection.host,
        latencyMs: Date.now() - startedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("/api/health error:", error);
    return NextResponse.json(
      {
        ok: false,
        db: { connected: false },
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 503 }
    );
  }
}
