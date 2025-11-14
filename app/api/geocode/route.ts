import { type NextRequest, NextResponse } from "next/server"
import { ensureOrderCoordinates } from "@/lib/ensure-coords"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/security/rate-limiter"
import { requireAdmin } from "@/lib/security/authorization"

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request, { maxRequests: 10, windowMs: 60000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    await requireAdmin()

    const body = await request.json()
    const { orderIds } = body

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "orderIds array required" }, { status: 400 })
    }

    if (orderIds.length > 100) {
      return NextResponse.json({ error: "Maximum 100 orders per request" }, { status: 400 })
    }

    const result = await ensureOrderCoordinates(orderIds)

    return NextResponse.json({
      success: true,
      geocoded: result.success.length,
      failed: result.failed.length,
      failures: result.failed,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Geocoding failed" }, { status: 500 })
  }
}
