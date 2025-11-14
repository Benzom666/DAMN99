import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { validateUUID, sanitizeNotes } from "@/lib/security/input-validation"
import { requireDriver } from "@/lib/security/authorization"

export async function POST(request: Request) {
  try {
    const { user } = await requireDriver()

    const body = await request.json()
    const { orderId, notes } = body

    if (!validateUUID(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const sanitizedNotes = notes ? sanitizeNotes(notes) : null

    const supabase = await createServerClient()

    const { data: order } = await supabase
      .from("orders")
      .select("id, route_id, routes!inner(driver_id)")
      .eq("id", orderId)
      .maybeSingle()

    if (!order || order.routes.driver_id !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      return NextResponse.json({ success: false, error: "Failed to update order status" }, { status: 500 })
    }

    await supabase.from("stop_events").insert({
      order_id: orderId,
      driver_id: user.id,
      event_type: "failed",
      notes: sanitizedNotes,
    })

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
