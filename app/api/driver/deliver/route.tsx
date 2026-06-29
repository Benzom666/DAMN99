import { NextResponse } from "next/server"
import { validateUUID, sanitizeNotes } from "@/lib/security/input-validation"
import { requireDriver } from "@/lib/security/authorization"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { ensurePodMediaBucket, POD_MEDIA_BUCKET } from "@/lib/supabase/storage"

/**
 * POST /api/driver/deliver  — single-request, storage-first proof of delivery.
 *
 * This is a from-scratch rebuild of the POD pipeline. The previous design was
 * a fragile two-phase commit: this endpoint created an empty POD row and
 * returned its id, and a SEPARATE request then tried to attach the photo +
 * signature. Any hiccup in that hand-off (a null podId, a dropped session on
 * the second request, navigation racing the upload) silently lost the media.
 *
 * The new flow does everything in ONE request:
 *   1. Authenticate the driver and verify they own the order (RLS).
 *   2. Upload photo + signature to Supabase Storage FIRST (service role).
 *   3. Write the order status + POD row with the media URLs already attached.
 *
 * It is also idempotent: a delivery can be safely retried (e.g. by the durable
 * IndexedDB queue after an offline period). If a POD already exists for the
 * order it is updated in place instead of duplicated, and storage paths are
 * deterministic (`pod-photos/{orderId}.ext`) so re-uploads overwrite.
 *
 * Accepts multipart/form-data (orderId, notes, recipientName, photo, signature)
 * or application/json (no media). Both are supported so older clients keep
 * working.
 */

export const runtime = "nodejs"
export const maxDuration = 60

type DeliveryPayload = {
  orderId: string
  notes: string | null
  recipientName: string | null
  photo: File | null
  signature: File | null
}

async function parseDeliveryPayload(request: Request): Promise<DeliveryPayload> {
  const contentType = request.headers.get("content-type") || ""

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    const photo = form.get("photo")
    const signature = form.get("signature")

    return {
      orderId: String(form.get("orderId") || ""),
      notes: form.get("notes") ? String(form.get("notes")) : null,
      recipientName: form.get("recipientName") ? String(form.get("recipientName")) : null,
      photo: photo instanceof File && photo.size > 0 ? photo : null,
      signature: signature instanceof File && signature.size > 0 ? signature : null,
    }
  }

  const body = await request.json().catch(() => ({}))
  return {
    orderId: body.orderId,
    notes: body.notes ?? null,
    recipientName: body.recipientName ?? null,
    photo: null,
    signature: null,
  }
}

function inferExtension(file: File, fallback: string): string {
  const fromName = file.name?.split(".").pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/heic" || file.type === "image/heif") return "heic"
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg"
  return fallback
}

/**
 * Upload one media file to the pod-media bucket at a deterministic path and
 * return its public URL. Throws on failure so the caller can surface a real
 * error instead of silently saving a POD with a missing photo.
 */
async function uploadMedia(
  admin: ReturnType<typeof createServiceRoleClient>,
  file: File,
  path: string,
  forcedContentType?: string,
): Promise<string> {
  let contentType = forcedContentType || file.type
  if (!contentType || contentType === "application/octet-stream") {
    contentType = "image/jpeg"
  }

  const { data, error } = await admin.storage
    .from(POD_MEDIA_BUCKET)
    .upload(path, file, { contentType, upsert: true })

  if (error) {
    throw new Error(`Storage upload failed (${path}): ${error.message}`)
  }

  const { data: pub } = admin.storage.from(POD_MEDIA_BUCKET).getPublicUrl(data.path)
  if (!pub?.publicUrl) {
    throw new Error(`Could not resolve public URL for ${path}`)
  }
  return pub.publicUrl
}

async function sendPODEmail(orderId: string, podId: string) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY
    const fromEmail = process.env.DELIVERY_FROM_EMAIL
    if (!apiKey || !fromEmail) return

    const admin = createServiceRoleClient()

    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, customer_name, customer_email, address")
      .eq("id", orderId)
      .maybeSingle()

    if (!order || !order.customer_email) return

    const { data: pod } = await admin
      .from("pods")
      .select("photo_url, signature_url, recipient_name, notes, delivered_at")
      .eq("id", podId)
      .maybeSingle()

    const orderNumber = order.order_number || order.id.substring(0, 8).toUpperCase()

    const emailData = {
      personalizations: [
        { to: [{ email: order.customer_email }], subject: `Delivery Complete - Order #${orderNumber}` },
      ],
      from: { email: fromEmail },
      content: [
        {
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6d28d9;">Delivery Completed</h2>
              <p>Your order has been successfully delivered.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order Number:</strong> #${orderNumber}</p>
                <p><strong>Customer:</strong> ${order.customer_name || "N/A"}</p>
                <p><strong>Delivery Address:</strong> ${order.address || "N/A"}</p>
                <p><strong>Delivered At:</strong> ${new Date(pod?.delivered_at || Date.now()).toLocaleString()}</p>
                ${pod?.recipient_name ? `<p><strong>Received By:</strong> ${pod.recipient_name}</p>` : ""}
                ${pod?.notes ? `<p><strong>Notes:</strong> ${pod.notes}</p>` : ""}
              </div>
              ${
                pod?.photo_url
                  ? `<div style="margin: 20px 0;"><p><strong>Delivery Photo:</strong></p>
                     <img src="${pod.photo_url}" alt="Delivery Photo" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`
                  : ""
              }
              ${
                pod?.signature_url
                  ? `<div style="margin: 20px 0;"><p><strong>Signature:</strong></p>
                     <img src="${pod.signature_url}" alt="Signature" style="max-width: 300px; border: 1px solid #e5e7eb; border-radius: 8px;" /></div>`
                  : ""
              }
            </div>`,
        },
      ],
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok || response.status === 202) {
      await admin.from("pod_emails").insert({
        pod_id: podId,
        order_id: orderId,
        to_email: order.customer_email,
        provider_message_id: response.headers.get("x-message-id") || "accepted",
        sent_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("[DELIVER] POD email failed (non-blocking):", error)
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireDriver()
    const { orderId, recipientName, notes, photo, signature } = await parseDeliveryPayload(request)

    if (!validateUUID(orderId)) {
      return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 })
    }

    const sanitizedNotes = notes ? sanitizeNotes(notes) : null
    const sanitizedRecipient = recipientName ? sanitizeNotes(recipientName) : null

    // 1. Mark the order delivered through the DRIVER's own (RLS-scoped) client.
    //    If the driver doesn't own this order, RLS returns no row → 403. This
    //    is our ownership proof; everything after runs as service role.
    const { data: updatedOrder, error: orderError } = await supabase
      .from("orders")
      .update({ status: "delivered", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id")
      .maybeSingle()

    if (orderError || !updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: orderError
            ? `Failed to update order status: ${orderError.message}`
            : "This order is not assigned to you.",
        },
        { status: orderError ? 500 : 403 },
      )
    }

    const admin = createServiceRoleClient()
    const warnings: string[] = []

    // 2. Storage-FIRST: upload media before writing the POD row, so the row is
    //    never created with a phantom/missing photo. Deterministic paths +
    //    upsert make retries idempotent.
    let photoUrl: string | null = null
    let signatureUrl: string | null = null

    if (photo || signature) {
      await ensurePodMediaBucket(admin)

      if (photo) {
        const ext = inferExtension(photo, "jpg")
        photoUrl = await uploadMedia(admin, photo, `pod-photos/${orderId}.${ext}`)
      }
      if (signature) {
        signatureUrl = await uploadMedia(admin, signature, `pod-signatures/${orderId}.png`, "image/png")
      }
    }

    // 3. Upsert the POD row WITH the media URLs already attached. Idempotent:
    //    a retried delivery updates the existing POD instead of duplicating it.
    //    Tolerant of any legacy duplicates (order by latest, take one) so this
    //    lookup never throws PGRST116 the way `.maybeSingle()` does on >1 row.
    const { data: existingPods } = await admin
      .from("pods")
      .select("id, photo_url, signature_url")
      .eq("order_id", orderId)
      .order("delivered_at", { ascending: false })
      .limit(1)
    const existingPod = existingPods?.[0] ?? null

    const podRow = {
      order_id: orderId,
      driver_id: user.id,
      // Preserve any URL we already have if this retry didn't carry that media.
      photo_url: photoUrl ?? existingPod?.photo_url ?? null,
      signature_url: signatureUrl ?? existingPod?.signature_url ?? null,
      recipient_name: sanitizedRecipient,
      notes: sanitizedNotes,
      delivered_at: new Date().toISOString(),
    }

    let podId: string | null = existingPod?.id ?? null

    if (existingPod?.id) {
      const { error: updateErr } = await admin.from("pods").update(podRow).eq("id", existingPod.id)
      if (updateErr) {
        console.error("[DELIVER] POD update failed:", updateErr)
        warnings.push("Delivery saved, but proof details could not be fully updated.")
      }
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from("pods")
        .insert(podRow)
        .select("id")
        .single()

      // Unique violation (23505) means a POD for this order already exists
      // (concurrent submit, or the unique index from migration 031). Update it
      // in place instead of creating a duplicate.
      if (insertErr && (insertErr as any).code === "23505") {
        console.warn("[DELIVER] POD already exists for order, updating in place")
        const { data: conflictRow } = await admin
          .from("pods")
          .select("id, photo_url, signature_url")
          .eq("order_id", orderId)
          .order("delivered_at", { ascending: false })
          .limit(1)
        const target = conflictRow?.[0]
        if (target?.id) {
          const merged = {
            ...podRow,
            photo_url: podRow.photo_url ?? target.photo_url ?? null,
            signature_url: podRow.signature_url ?? target.signature_url ?? null,
          }
          const { error: updErr } = await admin.from("pods").update(merged).eq("id", target.id)
          if (updErr) {
            console.error("[DELIVER] Conflict update failed:", updErr)
            warnings.push("Delivery saved, but proof details could not be fully updated.")
          } else {
            podId = target.id
          }
        }
      } else if (insertErr) {
        // Last-ditch fallback: some legacy DBs lack recipient_name. Retry
        // folding the recipient into notes so the POD (and its media) survive.
        console.error("[DELIVER] POD insert failed, attempting fallback:", insertErr)
        const fallbackNotes = sanitizedRecipient
          ? [`Recipient: ${sanitizedRecipient}`, sanitizedNotes].filter(Boolean).join("\n")
          : sanitizedNotes
        const { data: fb, error: fbErr } = await admin
          .from("pods")
          .insert({
            order_id: orderId,
            driver_id: user.id,
            photo_url: podRow.photo_url,
            signature_url: podRow.signature_url,
            notes: fallbackNotes,
            delivered_at: podRow.delivered_at,
          })
          .select("id")
          .single()
        if (fbErr) {
          console.error("[DELIVER] Fallback POD insert failed:", fbErr)
          warnings.push("Delivery completed, but proof of delivery could not be saved.")
        } else {
          podId = fb.id
        }
      } else {
        podId = inserted.id
      }
    }

    if (podId && process.env.NEXT_PUBLIC_ENABLE_POD_EMAIL !== "false") {
      // Fire and forget — never block the driver's response on email.
      sendPODEmail(orderId, podId).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      podId,
      photo_url: podRow.photo_url,
      signature_url: podRow.signature_url,
      warning: warnings[0] || null,
    })
  } catch (error) {
    console.error("[DELIVER] Unexpected error:", error)
    const message = error instanceof Error ? error.message : "An unexpected error occurred"
    if (message.toLowerCase().includes("required")) {
      return NextResponse.json({ success: false, error: message, code: "AUTH" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
