import { NextResponse } from "next/server"
import { validateUUID, sanitizeNotes } from "@/lib/security/input-validation"
import { requireDriver } from "@/lib/security/authorization"

async function sendPODEmail(orderId: string, podId: string) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY
    const fromEmail = process.env.DELIVERY_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      return { success: false, error: "Email not configured" }
    }

    const { createServerClient } = await import("@/lib/supabase/server")
    const supabase = await createServerClient()

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, delivery_address, full_address, address, address_line1")
      .eq("id", orderId)
      .maybeSingle()

    if (!order || !order.customer_email) {
      return { success: false, error: "Order or email not found" }
    }

    const { data: pod } = await supabase
      .from("pods")
      .select("photo_url, signature_url, recipient_name, notes, delivered_at")
      .eq("id", podId)
      .maybeSingle()

    const deliveryAddress =
      order.delivery_address || order.full_address || order.address || order.address_line1 || "Address not available"
    const orderNumber = order.order_number || order.id.substring(0, 8).toUpperCase()

    const emailData = {
      personalizations: [
        {
          to: [{ email: order.customer_email }],
          subject: `Delivery Complete - Order #${orderNumber}`,
        },
      ],
      from: { email: fromEmail },
      content: [
        {
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Delivery Completed</h2>
              <p>Your order has been successfully delivered!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order Number:</strong> #${orderNumber}</p>
                <p><strong>Customer:</strong> ${order.customer_name || "N/A"}</p>
                <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
                <p><strong>Delivered At:</strong> ${new Date(pod?.delivered_at || Date.now()).toLocaleString()}</p>
                ${pod?.recipient_name ? `<p><strong>Received By:</strong> ${pod.recipient_name}</p>` : ""}
                ${pod?.notes ? `<p><strong>Notes:</strong> ${pod.notes}</p>` : ""}
              </div>

              ${
                pod?.photo_url
                  ? `
                <div style="margin: 20px 0;">
                  <p><strong>Delivery Photo:</strong></p>
                  <img src="${pod.photo_url}" alt="Delivery Photo" style="max-width: 100%; height: auto; border-radius: 8px;" />
                  <p><a href="${pod.photo_url}" style="color: #2563eb;">View Full Size</a></p>
                </div>
              `
                  : ""
              }

              ${
                pod?.signature_url
                  ? `
                <div style="margin: 20px 0;">
                  <p><strong>Signature:</strong></p>
                  <img src="${pod.signature_url}" alt="Signature" style="max-width: 300px; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;" />
                  <p><a href="${pod.signature_url}" style="color: #2563eb;">View Full Size</a></p>
                </div>
              `
                  : ""
              }

              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                This is an automated delivery notification. Please do not reply to this email.
              </p>
            </div>
          `,
        },
      ],
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const messageId = response.headers.get("x-message-id")

    if (response.ok || response.status === 202) {
      await supabase.from("pod_emails").insert({
        pod_id: podId,
        order_id: orderId,
        to_email: order.customer_email,
        provider_message_id: messageId || "accepted",
        sent_at: new Date().toISOString(),
      })

      return { success: true, messageId }
    } else {
      const errorText = await response.text()
      return { success: false, error: errorText }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

type DeliveryPayload = {
  orderId: string
  notes?: string | null
  recipientName?: string | null
}

async function parseDeliveryPayload(request: Request): Promise<DeliveryPayload> {
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()

    return {
      orderId: String(form.get("orderId") || ""),
      notes: form.get("notes") ? String(form.get("notes")) : null,
      recipientName: form.get("recipientName") ? String(form.get("recipientName")) : null,
    }
  }

  const body = await request.json()
  return {
    orderId: body.orderId,
    notes: body.notes,
    recipientName: body.recipientName,
  }
}

export async function POST(request: Request) {
  try {
    console.log("[DELIVER] Starting delivery request")
    const { user, supabase } = await requireDriver()
    console.log("[DELIVER] Driver authenticated:", user.id)

    const { orderId, recipientName, notes } = await parseDeliveryPayload(request)
    console.log("[DELIVER] Payload parsed:", { orderId, hasRecipient: !!recipientName, hasNotes: !!notes })

    if (!validateUUID(orderId)) {
      console.error("[DELIVER] Invalid order ID:", orderId)
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const sanitizedNotes = notes ? sanitizeNotes(notes) : null
    const sanitizedRecipient = recipientName ? sanitizeNotes(recipientName) : null

    const warnings: string[] = []

    // Update order status first. This is the critical delivery action and must not depend on POD/media schema.
    console.log("[DELIVER] Updating order status to delivered:", orderId)
    const { data: updatedOrder, error: orderError } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id")
      .maybeSingle()

    if (orderError || !updatedOrder) {
      console.error("[DELIVER] Order update failed:", orderError)
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
    console.log("[DELIVER] Order status updated successfully")

    let podId: string | null = null

    // A POD row may already exist for this order — the stop could have been
    // delivered before (failed-delivery retry), or a previous request could
    // have double-submitted. Reuse the existing row instead of inserting a
    // duplicate. Duplicate rows are the root cause of the "photos/signature
    // disappear" bug: the driver's stop view reads a single POD per order with
    // `.maybeSingle()`, which returns nothing once more than one row exists, so
    // previously-uploaded media becomes invisible. When reusing, we MUST NOT
    // overwrite any photo_url/signature_url already stored on that row.
    const { data: priorPods, error: priorPodError } = await supabase
      .from("pods")
      .select("id")
      .eq("order_id", orderId)
      .order("delivered_at", { ascending: false })
      .limit(1)

    if (priorPodError) {
      console.error("[DELIVER] Prior POD lookup failed (will attempt insert):", priorPodError)
    }

    const existingPodId = priorPods?.[0]?.id ?? null
    const fallbackNotes = sanitizedRecipient
      ? [`Recipient: ${sanitizedRecipient}`, sanitizedNotes].filter(Boolean).join("\n")
      : sanitizedNotes

    if (existingPodId) {
      console.log("[DELIVER] Reusing existing POD record:", existingPodId)
      // Update metadata only; leave photo_url/signature_url untouched so any
      // media uploaded on a prior attempt is preserved.
      const { error: podUpdateError } = await supabase
        .from("pods")
        .update({
          driver_id: user.id,
          recipient_name: sanitizedRecipient,
          notes: sanitizedNotes,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", existingPodId)

      if (podUpdateError) {
        console.error("[DELIVER] POD update failed, retrying without recipient_name:", podUpdateError)
        const { error: fallbackUpdateError } = await supabase
          .from("pods")
          .update({
            driver_id: user.id,
            notes: fallbackNotes,
            delivered_at: new Date().toISOString(),
          })
          .eq("id", existingPodId)

        if (fallbackUpdateError) {
          console.error("[DELIVER] Fallback POD update failed:", fallbackUpdateError)
          warnings.push("Delivery was completed, but proof of delivery details could not be saved.")
        } else {
          podId = existingPodId
          warnings.push("Delivery was completed. Recipient name was saved in notes because the POD schema is outdated.")
        }
      } else {
        podId = existingPodId
        console.log("[DELIVER] Existing POD updated:", podId)
      }
    } else {
      const podInsert = {
        order_id: orderId,
        driver_id: user.id,
        photo_url: null,
        signature_url: null,
        recipient_name: sanitizedRecipient,
        notes: sanitizedNotes,
        delivered_at: new Date().toISOString(),
      }

      console.log("[DELIVER] Creating POD record")
      const { data: podData, error: podError } = await supabase.from("pods").insert(podInsert).select("id").single()

      if (podError) {
        console.error("[DELIVER] Full POD insert failed after delivery was saved:", podError)

        console.log("[DELIVER] Attempting fallback POD insert")
        const { data: fallbackPod, error: fallbackPodError } = await supabase
          .from("pods")
          .insert({
            order_id: orderId,
            driver_id: user.id,
            photo_url: null,
            signature_url: null,
            notes: fallbackNotes,
            delivered_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (fallbackPodError) {
          console.error("[DELIVER] Fallback POD insert failed after delivery was saved:", fallbackPodError)
          warnings.push("Delivery was completed, but proof of delivery details could not be saved.")
        } else {
          podId = fallbackPod.id
          console.log("[DELIVER] Fallback POD created:", podId)
          warnings.push("Delivery was completed. Recipient name was saved in notes because the POD schema is outdated.")
        }
      } else {
        podId = podData.id
        console.log("[DELIVER] POD created successfully:", podId)
      }
    }

    if (podId && process.env.NEXT_PUBLIC_ENABLE_POD_EMAIL !== "false") {
      console.log("[DELIVER] Sending POD email")
      sendPODEmail(orderId, podId).catch((error) => {
        console.error("[DELIVER] Failed to send POD email:", error)
      })
    }

    console.log("[DELIVER] Delivery completed successfully")
    return NextResponse.json({ success: true, podId, warning: warnings[0] || null })
  } catch (error) {
    console.error("[DELIVER] Unexpected error:", error)
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
