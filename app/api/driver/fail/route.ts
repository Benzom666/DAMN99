import { NextResponse } from "next/server"
import { validateUUID, sanitizeNotes } from "@/lib/security/input-validation"
import { requireDriver } from "@/lib/security/authorization"

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireDriver()

    const body = await request.json()
    const { orderId, notes } = body

    if (!validateUUID(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const sanitizedNotes = notes ? sanitizeNotes(notes) : null

    const { data: updatedOrder, error: orderError } = await supabase
      .from("orders")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id")
      .maybeSingle()

    if (orderError || !updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: orderError
            ? `Failed to update order status: ${orderError.message}`
            : "Order was not available for this driver.",
        },
        { status: orderError ? 500 : 403 },
      )
    }

    const { error: eventError } = await supabase.from("stop_events").insert({
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
