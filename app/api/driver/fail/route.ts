import { NextResponse } from "next/server"
import { validateUUID, sanitizeNotes } from "@/lib/security/input-validation"
import { requireDriver } from "@/lib/security/authorization"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { user } = await requireDriver()

    const body = await request.json()
    const { orderId, notes } = body

    if (!validateUUID(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const sanitizedNotes = notes ? sanitizeNotes(notes) : null

    const supabaseAdmin = createServiceRoleClient()

    const { data: order, error: orderLookupError } = await supabaseAdmin
      .from("orders")
      .select("id, route_id")
      .eq("id", orderId)
      .maybeSingle()

    if (orderLookupError || !order?.route_id) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const { data: route, error: routeLookupError } = await supabaseAdmin
      .from("routes")
      .select("driver_id")
      .eq("id", order.route_id)
      .maybeSingle()

    if (routeLookupError || !route || route.driver_id !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      return NextResponse.json(
        { success: false, error: `Failed to update order status: ${orderError.message}` },
        { status: 500 },
      )
    }

    const { error: eventError } = await supabaseAdmin.from("stop_events").insert({
      order_id: orderId,
      driver_id: user.id,
      event_type: "failed",
      notes: sanitizedNotes,
    })

    if (eventError) {
      console.error("[v0] [DRIVER_FAIL] Failed to insert stop event:", eventError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
