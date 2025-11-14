import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { validateUUID, sanitizeNotes } from "@/lib/security/input-validation"
import { requireDriver } from "@/lib/security/authorization"

async function sendPODEmail(orderId: string, podId: string) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY
    const fromEmail = process.env.DELIVERY_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      return { success: false, error: "Email not configured" }
    }

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

    // Fetch all photos for this POD
    const { data: podPhotos } = await supabase
      .from("pod_photos")
      .select("photo_url, photo_order")
      .eq("pod_id", podId)
      .order("photo_order", { ascending: true })

    const deliveryAddress =
      order.delivery_address || order.full_address || order.address || order.address_line1 || "Address not available"
    const orderNumber = order.order_number || order.id.substring(0, 8).toUpperCase()

    const photoUrls = podPhotos && podPhotos.length > 0 
      ? podPhotos.map(p => p.photo_url) 
      : (pod?.photo_url ? [pod.photo_url] : [])

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
                photoUrls.length > 0
                  ? `
                <div style="margin: 20px 0;">
                  <p><strong>Delivery Photos:</strong></p>
                  ${photoUrls.map((url: string, index: number) => `
                    <div style="margin-bottom: 15px;">
                      <img src="${url}" alt="Delivery Photo ${index + 1}" style="max-width: 100%; height: auto; border-radius: 8px;" />
                      <p><a href="${url}" style="color: #2563eb;">View Full Size Photo ${index + 1}</a></p>
                    </div>
                  `).join('')}
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
    const { user } = await requireDriver()

    const body = await request.json()
    const { orderId, photoDataArray, signatureData, recipientName, notes } = body

    if (!validateUUID(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const sanitizedNotes = notes ? sanitizeNotes(notes) : null
    const sanitizedRecipient = recipientName ? sanitizeNotes(recipientName) : null

    const supabase = await createServerClient()

    const { data: order } = await supabase
      .from("orders")
      .select("id, route_id, routes!inner(driver_id)")
      .eq("id", orderId)
      .maybeSingle()

    if (!order || order.routes.driver_id !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const photoUrls: string[] = []
    if (photoDataArray && Array.isArray(photoDataArray) && photoDataArray.length > 0) {
      console.log("[v0] Uploading", photoDataArray.length, "photos")
      
      for (let i = 0; i < Math.min(photoDataArray.length, 4); i++) {
        const photoData = photoDataArray[i]
        const photoBlob = base64ToBlob(photoData)
        const uploaded = await put(`pod-photos/${orderId}-${Date.now()}-${i}.jpg`, photoBlob, {
          access: "public",
          contentType: "image/jpeg",
        })
        photoUrls.push(uploaded.url)
        console.log(`[v0] Photo ${i + 1} uploaded:`, uploaded.url)
      }
    }

    // Upload signature
    let signatureUrl = null
    if (signatureData) {
      const signatureBlob = base64ToBlob(signatureData)
      const uploaded = await put(`pod-signatures/${orderId}-${Date.now()}.png`, signatureBlob, {
        access: "public",
        contentType: "image/png",
      })
      signatureUrl = uploaded.url
    }

    const { data: podData, error: podError } = await supabase
      .from("pods")
      .insert({
        order_id: orderId,
        driver_id: user.id,
        photo_url: photoUrls[0] || null, // Keep first photo for backward compatibility
        signature_url: signatureUrl,
        recipient_name: sanitizedRecipient,
        notes: sanitizedNotes,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (podError) {
      console.error("[v0] POD save error:", podError)
      return NextResponse.json({ success: false, error: "Failed to save POD" }, { status: 500 })
    }

    if (photoUrls.length > 0) {
      const photosToInsert = photoUrls.map((url, index) => ({
        pod_id: podData.id,
        photo_url: url,
        photo_order: index + 1,
      }))

      const { error: photosError } = await supabase
        .from("pod_photos")
        .insert(photosToInsert)

      if (photosError) {
        console.error("[v0] Error saving photos:", photosError)
      }
    }

    // Update order status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      return NextResponse.json({ success: false, error: "Failed to update order status" }, { status: 500 })
    }

    // Send POD email (photos only, no signature)
    if (process.env.NEXT_PUBLIC_ENABLE_POD_EMAIL !== "false") {
      await sendPODEmail(orderId, podData.id)
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
