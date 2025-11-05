import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

async function sendPODEmail(orderId: string, podId: string) {
  try {
    console.log("[v0] [EMAIL] ========== EMAIL SEND START ==========")

    const apiKey = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY
    const fromEmail = process.env.DELIVERY_FROM_EMAIL

    console.log("[v0] [EMAIL] API key exists:", !!apiKey)
    console.log("[v0] [EMAIL] From email:", fromEmail)

    if (!apiKey) {
      console.error("[v0] [EMAIL] ❌ NO SENDGRID API KEY")
      return { success: false, error: "No API key" }
    }

    if (!fromEmail) {
      console.error("[v0] [EMAIL] ❌ NO FROM EMAIL")
      return { success: false, error: "No from email" }
    }

    const supabase = await createServerClient()

    // Fetch order data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, delivery_address, full_address, address, address_line1")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError || !order) {
      console.log("[v0] [EMAIL] Order not found:", orderError?.message)
      return { success: false, error: "Order not found" }
    }

    if (!order.customer_email) {
      console.log("[v0] [EMAIL] No customer email, skipping")
      return { success: false, error: "No customer email" }
    }

    // Fetch POD data
    const { data: pod, error: podError } = await supabase
      .from("pods")
      .select("photo_url, signature_url, recipient_name, notes, delivered_at")
      .eq("id", podId)
      .maybeSingle()

    if (podError) {
      console.error("[v0] [EMAIL] POD fetch error:", podError)
    }

    const { data: podPhotos } = await supabase
      .from("pod_photos")
      .select("photo_url")
      .eq("pod_id", podId)
      .order("photo_order", { ascending: true })

    const allPhotos = podPhotos || []
    console.log("[v0] [EMAIL] Found", allPhotos.length, "photos")

    const deliveryAddress =
      order.delivery_address || order.full_address || order.address || order.address_line1 || "Address not available"
    const orderNumber = order.order_number || order.id.substring(0, 8).toUpperCase()

    console.log("[v0] [EMAIL] Sending to:", order.customer_email)
    console.log("[v0] [EMAIL] Order:", orderNumber)
    console.log("[v0] [EMAIL] Address:", deliveryAddress)
    console.log("[v0] [EMAIL] Photos:", allPhotos.length)
    console.log("[v0] [EMAIL] Signature:", pod?.signature_url ? "YES" : "NO")

    let photosHtml = ""
    if (allPhotos.length > 0) {
      photosHtml = `
        <div style="margin: 20px 0;">
          <p><strong>Delivery Photos (${allPhotos.length}):</strong></p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
            ${allPhotos
              .map(
                (photo, index) => `
              <div style="text-align: center;">
                <img src="${photo.photo_url}" alt="Delivery Photo ${index + 1}" 
                     style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
                <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                  Photo ${index + 1} of ${allPhotos.length} | 
                  <a href="${photo.photo_url}" style="color: #2563eb;">View Full Size</a>
                </p>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
    } else if (pod?.photo_url) {
      // Fallback to legacy single photo if no photos in pod_photos table
      photosHtml = `
        <div style="margin: 20px 0;">
          <p><strong>Delivery Photo:</strong></p>
          <img src="${pod.photo_url}" alt="Delivery Photo" style="max-width: 100%; height: auto; border-radius: 8px;" />
          <p><a href="${pod.photo_url}" style="color: #2563eb;">View Full Size</a></p>
        </div>
      `
    } else {
      photosHtml = "<p style='color: #ef4444;'>⚠️ No delivery photo available</p>"
    }

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

              ${photosHtml}

              ${
                pod?.signature_url
                  ? `
                <div style="margin: 20px 0;">
                  <p><strong>Signature:</strong></p>
                  <img src="${pod.signature_url}" alt="Signature" style="max-width: 300px; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;" />
                  <p><a href="${pod.signature_url}" style="color: #2563eb;">View Full Size</a></p>
                </div>
              `
                  : "<p style='color: #ef4444;'>⚠️ No signature available</p>"
              }

              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                This is an automated delivery notification. Please do not reply to this email.
              </p>
            </div>
          `,
        },
      ],
    }

    console.log("[v0] [EMAIL] Calling SendGrid...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

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

    console.log("[v0] [EMAIL] SendGrid status:", response.status)
    console.log("[v0] [EMAIL] Message ID:", messageId)

    if (response.ok || response.status === 202) {
      // Record email sent
      await supabase.from("pod_emails").insert({
        pod_id: podId,
        order_id: orderId,
        to_email: order.customer_email,
        provider_message_id: messageId || "accepted",
        sent_at: new Date().toISOString(),
      })

      console.log("[v0] [EMAIL] ✅ Email sent successfully!")
      console.log("[v0] [EMAIL] ========== EMAIL SEND END ==========")
      return { success: true, messageId }
    } else {
      const errorText = await response.text()
      console.error("[v0] [EMAIL] ❌ SendGrid error:", response.status, errorText)
      console.log("[v0] [EMAIL] ========== EMAIL SEND END ==========")
      return { success: false, error: errorText }
    }
  } catch (error) {
    console.error("[v0] [EMAIL] ❌ Exception:", error instanceof Error ? error.message : String(error))
    console.log("[v0] [EMAIL] ========== EMAIL SEND END ==========")
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
    const body = await request.json()
    const { orderId, photoDataArray, signatureData, recipientName, notes } = body

    console.log("[v0] [API] ========== DELIVERY START ==========")
    console.log("[v0] [API] Order ID:", orderId)
    console.log("[v0] [API] Number of photos:", photoDataArray?.length || 0)

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] [API] Auth error:", authError)
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const photoUrls: string[] = []
    if (photoDataArray && Array.isArray(photoDataArray) && photoDataArray.length > 0) {
      console.log("[v0] [API] Uploading photos...")

      for (let i = 0; i < Math.min(photoDataArray.length, 4); i++) {
        const photoData = photoDataArray[i]
        try {
          const photoBlob = base64ToBlob(photoData)
          const uploaded = await put(`pod-photos/${orderId}-${Date.now()}-${i + 1}.jpg`, photoBlob, {
            access: "public",
            contentType: "image/jpeg",
          })
          photoUrls.push(uploaded.url)
          console.log(`[v0] [API] Photo ${i + 1} uploaded:`, uploaded.url)
        } catch (uploadError) {
          console.error(`[v0] [API] Failed to upload photo ${i + 1}:`, uploadError)
          // Continue with other photos even if one fails
        }
      }
    }

    // Upload signature
    let signatureUrl = null
    if (signatureData) {
      console.log("[v0] [API] Uploading signature...")
      const signatureBlob = base64ToBlob(signatureData)
      const uploaded = await put(`pod-signatures/${orderId}-${Date.now()}.png`, signatureBlob, {
        access: "public",
        contentType: "image/png",
      })
      signatureUrl = uploaded.url
      console.log("[v0] [API] Signature uploaded:", signatureUrl)
    }

    console.log("[v0] [API] Saving POD...")
    const { data: podData, error: podError } = await supabase
      .from("pods")
      .insert({
        order_id: orderId,
        driver_id: user.id,
        photo_url: photoUrls[0] || null, // Keep first photo in main table for compatibility
        signature_url: signatureUrl,
        recipient_name: recipientName,
        notes,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (podError) {
      console.error("[v0] [API] POD save error:", podError)
      return NextResponse.json({ success: false, error: "Failed to save POD" }, { status: 500 })
    }

    console.log("[v0] [API] POD saved:", podData.id)

    if (photoUrls.length > 0) {
      console.log("[v0] [API] Saving additional photos...")
      const photoRecords = photoUrls.map((url, index) => ({
        pod_id: podData.id,
        photo_url: url,
        photo_order: index + 1,
      }))

      const { error: photosError } = await supabase.from("pod_photos").insert(photoRecords)

      if (photosError) {
        console.error("[v0] [API] Failed to save photo records:", photosError)
        // Don't fail the whole operation if photo records fail
      } else {
        console.log("[v0] [API] Saved", photoUrls.length, "photo records")
      }
    }

    // Update order status
    console.log("[v0] [API] Updating order status...")
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      console.error("[v0] [API] Order update error:", orderError)
      return NextResponse.json({ success: false, error: "Failed to update order status" }, { status: 500 })
    }

    console.log("[v0] [API] Order marked as delivered")

    if (process.env.NEXT_PUBLIC_ENABLE_POD_EMAIL !== "false") {
      console.log("[v0] [API] Sending POD email...")
      const emailResult = await sendPODEmail(orderId, podData.id)
      console.log("[v0] [API] Email result:", emailResult.success ? "SUCCESS" : "FAILED")
    } else {
      console.log("[v0] [API] POD email disabled")
    }

    console.log("[v0] [API] ========== DELIVERY END ==========")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] [API] Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
