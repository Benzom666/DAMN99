import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendSendgridMail } from "@/lib/mail/sendgrid-http"
import { put } from "@vercel/blob"

function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(",")
  const contentType = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream"
  const base64 = parts[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: contentType })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, notes, photoDataArray = [] } = body

    console.log("[v0] [API] Marking order as failed:", orderId)
    console.log("[v0] [API] Number of photos:", photoDataArray.length)

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] [API] Auth error:", authError)
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { data: order, error: orderFetchError } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, address, city, state, zip, order_number")
      .eq("id", orderId)
      .single()

    if (orderFetchError || !order) {
      console.error("[v0] [API] Order fetch error:", orderFetchError)
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      console.error("[v0] [API] Order update error:", orderError)
      return NextResponse.json({ success: false, error: "Failed to update order status" }, { status: 500 })
    }

    await supabase.from("stop_events").insert({
      order_id: orderId,
      driver_id: user.id,
      event_type: "failed",
      notes,
    })

    console.log("[v0] [API] Order marked as failed")

    let podId: string | null = null
    const photoUrls: string[] = []

    if (photoDataArray.length > 0) {
      console.log("[v0] [API] Uploading", photoDataArray.length, "photos for failed delivery")

      for (let i = 0; i < Math.min(photoDataArray.length, 4); i++) {
        try {
          const photoData = photoDataArray[i]
          const photoBlob = base64ToBlob(photoData)
          const uploaded = await put(`failed-delivery-photos/${orderId}-${Date.now()}-${i + 1}.jpg`, photoBlob, {
            access: "public",
            contentType: "image/jpeg",
          })
          photoUrls.push(uploaded.url)
          console.log(`[v0] [API] Photo ${i + 1} uploaded:`, uploaded.url)
        } catch (uploadError) {
          console.error(`[v0] [API] Failed to upload photo ${i + 1}:`, uploadError)
        }
      }
    }

    if (photoUrls.length > 0) {
      const { data: pod, error: podError } = await supabase
        .from("pods")
        .insert({
          order_id: orderId,
          driver_id: user.id,
          photo_url: photoUrls[0],
          notes,
          delivered_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (podError) {
        console.error("[v0] [API] POD creation error:", podError)
      } else {
        podId = pod.id
        console.log("[v0] [API] Created POD record:", podId)

        if (photoUrls.length > 0) {
          const photoRecords = photoUrls.map((url, index) => ({
            pod_id: podId,
            photo_url: url,
            photo_order: index + 1,
          }))

          const { error: photosError } = await supabase.from("pod_photos").insert(photoRecords)

          if (photosError) {
            console.error("[v0] [API] Error saving photo records:", photosError)
          } else {
            console.log("[v0] [API] Saved", photoUrls.length, "photo records")
          }
        }
      }
    }

    if (order.customer_email && process.env.NEXT_PUBLIC_ENABLE_POD_EMAIL === "true") {
      console.log("[v0] [API] Sending failed delivery email to:", order.customer_email)

      try {
        await sendFailedDeliveryEmail(supabase, orderId, order, notes, photoUrls)
        console.log("[v0] [API] Failed delivery email sent successfully")
      } catch (emailError) {
        console.error("[v0] [API] Failed delivery email error (non-blocking):", emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] [API] Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

async function sendFailedDeliveryEmail(
  supabase: any,
  orderId: string,
  order: any,
  notes: string,
  photoUrls: string[] = [],
) {
  try {
    const apiKey = process.env.SEND_GRID_API_KEY || process.env.SENDGRID_API_KEY || ""
    const from = process.env.DELIVERY_FROM_EMAIL || ""

    if (!apiKey || !from) {
      console.error("[v0] [EMAIL] Missing email configuration")
      return
    }

    try {
      const { data: exists, error: checkError } = await supabase
        .from("failed_delivery_emails")
        .select("order_id")
        .eq("order_id", orderId)
        .maybeSingle()

      if (!checkError && exists) {
        console.log("[v0] [EMAIL] Failed delivery email already sent for order:", orderId)
        return
      }
    } catch (checkError: any) {
      console.log("[v0] [EMAIL] Skipping duplicate check (table not found)")
    }

    const fullAddress = [order.address, order.city, order.state, order.zip].filter(Boolean).join(", ")
    const orderNumber = order.order_number || order.id.substring(0, 8).toUpperCase()

    const photosHtml =
      photoUrls.length > 0
        ? `
      <div style="margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; margin-bottom: 10px;">Photos from Delivery Attempt (${photoUrls.length}):</p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${photoUrls
            .map(
              (url, index) => `
            <div style="position: relative;">
              <img src="${url}" alt="Failed delivery photo ${index + 1}" style="width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" />
              <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                Photo ${index + 1} of ${photoUrls.length}
              </div>
              <a href="${url}" target="_blank" style="display: block; text-align: center; margin-top: 5px; color: #3b82f6; text-decoration: none; font-size: 12px;">View Full Size</a>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `
        : ""

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Delivery Attempt Failed – Order ${orderNumber}</h2>
        <p>We're sorry, but we were unable to complete the delivery for your order.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Order Details:</p>
          <p style="margin: 5px 0;"><b>Customer:</b> ${order.customer_name}</p>
          <p style="margin: 5px 0;"><b>Delivery Address:</b> ${fullAddress}</p>
          <p style="margin: 5px 0;"><b>Order Number:</b> ${orderNumber}</p>
        </div>

        ${
          notes
            ? `
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; margin-bottom: 10px;">Reason for Failed Delivery:</p>
            <p style="margin: 0; color: #374151;">${notes}</p>
          </div>
        `
            : ""
        }

        ${photosHtml}

        <p style="margin-top: 20px;">Our team will contact you shortly to reschedule the delivery or discuss alternative arrangements.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you have any questions, please contact our customer service team.
        </p>
      </div>
    `.trim()

    console.log("[v0] [EMAIL] Sending failed delivery email with", photoUrls.length, "photos to:", order.customer_email)

    const resp = await sendSendgridMail({
      apiKey,
      from,
      to: order.customer_email,
      subject: `Delivery Attempt Failed – ${order.customer_name}`,
      html,
    })

    console.log("[v0] [EMAIL] SendGrid response status:", resp.status)

    if (resp.ok) {
      try {
        await supabase.from("failed_delivery_emails").insert({
          order_id: orderId,
          to_email: order.customer_email,
          provider_message_id: resp.headers.get("x-message-id") ?? "accepted",
        })
        console.log("[v0] [EMAIL] Email record saved successfully")
      } catch (insertError: any) {
        console.log("[v0] [EMAIL] Email sent but not recorded (table not found)")
      }
    } else {
      const errorText = await resp.text()
      console.error("[v0] [EMAIL] SendGrid error:", errorText)
      throw new Error(`SendGrid API error: ${resp.status}`)
    }
  } catch (error) {
    console.error("[v0] [EMAIL] Error in sendFailedDeliveryEmail:", error)
    throw error
  }
}
