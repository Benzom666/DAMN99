import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireDriver } from "@/lib/security/authorization"
import { validateUUID } from "@/lib/security/input-validation"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * POST /api/driver/pod-media/upload
 *
 * Up-front authorization uses the driver's cookie session (requireDriver).
 * The actual storage upload runs through a service-role client so the
 * upload itself never depends on cookie state surviving the fetch boundary.
 * That eliminates the "first request after token refresh fails" class of
 * bugs entirely.
 *
 * The client sends the ORDER id (`orderId`). The matching `pods` row may not
 * exist yet at upload time — the driver uploads media before the delivery is
 * marked complete — so we resolve ownership through the order → route → driver
 * chain and create (or reuse) the POD row here. Previously the client sent the
 * order id under the `podId` field and the route looked it up directly in the
 * `pods` table, which never matched, so EVERY upload 404'd and no photo or
 * signature was ever stored. (`podId` is still accepted as a legacy alias.)
 *
 * Paths are deterministic (`pod-photos/{podId}.{ext}`) and uploads use
 * `upsert: true` so retries are idempotent — running the same upload
 * twice replaces the file in place and produces the same public URL,
 * never an orphan. The `pods.photo_url` / `pods.signature_url` columns
 * end up correct regardless of how many retries happened.
 */
export async function POST(request: Request) {
  console.log("[POD_UPLOAD] ========== UPLOAD REQUEST START ==========")
  try {
    const { user } = await requireDriver()
    console.log("[POD_UPLOAD] Driver authenticated:", user.id)

    // The actual storage + DB write uses service role to avoid any
    // session-cookie surprises mid-request.
    const admin = createServiceRoleClient()

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (err) {
      console.error("[POD_UPLOAD] Failed to parse FormData:", err)
      return NextResponse.json(
        { success: false, error: "Invalid form data", code: "BAD_FORM" },
        { status: 400 },
      )
    }

    // Accept the order id (preferred). `podId` is kept as a legacy alias for
    // older clients, but it actually carried the order id too.
    const orderId = String(formData.get("orderId") || formData.get("podId") || "")
    console.log("[POD_UPLOAD] Order ID:", orderId)

    if (!validateUUID(orderId)) {
      console.error("[POD_UPLOAD] Invalid order ID")
      return NextResponse.json(
        { success: false, error: "Invalid order ID", code: "BAD_ORDER_ID" },
        { status: 400 },
      )
    }

    // Verify the order belongs to this driver via its route, then make sure a
    // POD row exists to attach the media to. Service role can read every row,
    // so ownership is enforced explicitly on the route's driver_id.
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, routes!inner(driver_id)")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError) {
      console.error("[POD_UPLOAD] Order lookup error:", orderError)
      return NextResponse.json(
        { success: false, error: "Order lookup failed", code: "ORDER_LOOKUP" },
        { status: 500 },
      )
    }

    if (!order) {
      console.error("[POD_UPLOAD] Order not found:", orderId)
      return NextResponse.json(
        { success: false, error: "Order not found", code: "ORDER_MISSING" },
        { status: 404 },
      )
    }

    // @ts-expect-error - routes is a joined relation
    const driverId = order.routes?.driver_id
    if (driverId !== user.id) {
      console.error("[POD_UPLOAD] Order does not belong to this driver")
      return NextResponse.json(
        { success: false, error: "Unauthorized for this order", code: "ORDER_FORBIDDEN" },
        { status: 403 },
      )
    }

    // Resolve (or create) the POD row this media belongs to.
    const { data: existingPod, error: podLookupError } = await admin
      .from("pods")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle()

    if (podLookupError) {
      console.error("[POD_UPLOAD] POD lookup error:", podLookupError)
      return NextResponse.json(
        { success: false, error: "POD lookup failed", code: "POD_LOOKUP" },
        { status: 500 },
      )
    }

    let podId: string
    if (existingPod) {
      podId = existingPod.id
    } else {
      const { data: newPod, error: podInsertError } = await admin
        .from("pods")
        .insert({ order_id: orderId, driver_id: user.id, status: "in_progress" })
        .select("id")
        .single()

      if (podInsertError || !newPod) {
        console.error("[POD_UPLOAD] POD create failed:", podInsertError)
        return NextResponse.json(
          { success: false, error: "Failed to create POD record", code: "POD_CREATE" },
          { status: 500 },
        )
      }
      podId = newPod.id
    }

    console.log("[POD_UPLOAD] POD resolved:", podId)

    const updates: { photo_url?: string; signature_url?: string } = {}

    // ---------- Photo ----------
    const photoFile = formData.get("photo") as File | null
    if (photoFile && photoFile.size > 0) {
      // Deterministic path so retries replace the same object instead of
      // piling up orphan files. Extension is best-effort; default to jpg.
      const ext = inferExtension(photoFile, "jpg")
      const path = `pod-photos/${podId}.${ext}`

      // Some mobile browsers send octet-stream — force a sane content type.
      let contentType = photoFile.type
      if (!contentType || contentType === "application/octet-stream") {
        contentType = "image/jpeg"
      }

      console.log(
        "[POD_UPLOAD] Uploading photo →",
        path,
        "size:", photoFile.size,
        "type:", contentType,
      )

      const { data: photoData, error: photoError } = await admin.storage
        .from("pod-media")
        .upload(path, photoFile, { contentType, upsert: true })

      if (photoError) {
        console.error("[POD_UPLOAD] Photo upload failed:", photoError)
        return NextResponse.json(
          {
            success: false,
            error: `Photo upload failed: ${photoError.message}`,
            code: "STORAGE_PHOTO",
          },
          { status: 502 },
        )
      }

      const { data: photoUrl } = admin.storage
        .from("pod-media")
        .getPublicUrl(photoData.path)
      updates.photo_url = photoUrl.publicUrl
      console.log("[POD_UPLOAD] Photo uploaded:", updates.photo_url)
    }

    // ---------- Signature ----------
    const signatureFile = formData.get("signature") as File | null
    if (signatureFile && signatureFile.size > 0) {
      const path = `pod-signatures/${podId}.png`

      console.log(
        "[POD_UPLOAD] Uploading signature →",
        path,
        "size:", signatureFile.size,
      )

      const { data: sigData, error: sigError } = await admin.storage
        .from("pod-media")
        .upload(path, signatureFile, {
          contentType: "image/png",
          upsert: true,
        })

      if (sigError) {
        console.error("[POD_UPLOAD] Signature upload failed:", sigError)
        return NextResponse.json(
          {
            success: false,
            error: `Signature upload failed: ${sigError.message}`,
            code: "STORAGE_SIG",
          },
          { status: 502 },
        )
      }

      const { data: sigUrl } = admin.storage
        .from("pod-media")
        .getPublicUrl(sigData.path)
      updates.signature_url = sigUrl.publicUrl
      console.log("[POD_UPLOAD] Signature uploaded:", updates.signature_url)
    }

    if (Object.keys(updates).length === 0) {
      console.warn("[POD_UPLOAD] No media in request")
      return NextResponse.json(
        { success: false, error: "No photo or signature provided", code: "EMPTY" },
        { status: 400 },
      )
    }

    // Patch the POD row.
    const { error: updateError } = await admin
      .from("pods")
      .update(updates)
      .eq("id", podId)
      .eq("driver_id", user.id)

    if (updateError) {
      console.error("[POD_UPLOAD] POD update failed:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save media URLs: ${updateError.message}`,
          code: "DB_UPDATE",
        },
        { status: 500 },
      )
    }

    console.log("[POD_UPLOAD] POD row updated with URLs")

    try {
      revalidatePath("/driver/routes")
      revalidatePath("/admin/dispatch")
    } catch (err) {
      console.warn("[POD_UPLOAD] revalidate failed (non-fatal):", err)
    }

    console.log("[POD_UPLOAD] ========== UPLOAD REQUEST SUCCESS ==========")
    return NextResponse.json({
      success: true,
      photo_url: updates.photo_url,
      signature_url: updates.signature_url,
    })
  } catch (error) {
    console.error("[POD_UPLOAD] ========== UPLOAD REQUEST FAILED ==========")
    console.error("[POD_UPLOAD] Unexpected error:", error)
    const message = error instanceof Error ? error.message : "Upload failed"

    // requireDriver throws with messages like "Driver access required" /
    // "Authentication required" — surface those as 401 so the client knows
    // to re-auth rather than infinitely retrying.
    if (message.toLowerCase().includes("required")) {
      return NextResponse.json(
        { success: false, error: message, code: "AUTH" },
        { status: 401 },
      )
    }

    return NextResponse.json(
      { success: false, error: message, code: "UNEXPECTED" },
      { status: 500 },
    )
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
