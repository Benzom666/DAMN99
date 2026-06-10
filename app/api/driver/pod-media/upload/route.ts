import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireDriver } from "@/lib/security/authorization"
import { validateUUID } from "@/lib/security/input-validation"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { ensurePodMediaBucket, POD_MEDIA_BUCKET } from "@/lib/supabase/storage"

/**
 * POST /api/driver/pod-media/upload
 *
 * Up-front authorization uses the driver's cookie session (requireDriver).
 * The actual storage upload runs through a service-role client so the
 * upload itself never depends on cookie state surviving the fetch boundary.
 * That eliminates the "first request after token refresh fails" class of
 * bugs entirely.
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

    // Self-heal: guarantee the bucket exists and is public before we upload.
    // Removes the fragile dependency on an operator having run migration 027.
    await ensurePodMediaBucket(admin)

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

    const podId = String(formData.get("podId") || "")
    console.log("[POD_UPLOAD] POD ID:", podId)

    if (!validateUUID(podId)) {
      console.error("[POD_UPLOAD] Invalid POD ID")
      return NextResponse.json(
        { success: false, error: "Invalid POD ID", code: "BAD_POD_ID" },
        { status: 400 },
      )
    }

    // Verify the POD belongs to this driver — service role can read every
    // row, so we filter explicitly on driver_id to enforce ownership.
    const { data: pod, error: podError } = await admin
      .from("pods")
      .select("id, driver_id")
      .eq("id", podId)
      .maybeSingle()

    if (podError) {
      console.error("[POD_UPLOAD] POD lookup error:", podError)
      return NextResponse.json(
        { success: false, error: "POD lookup failed", code: "POD_LOOKUP" },
        { status: 500 },
      )
    }

    if (!pod) {
      console.error("[POD_UPLOAD] POD not found:", podId)
      return NextResponse.json(
        { success: false, error: "POD not found", code: "POD_MISSING" },
        { status: 404 },
      )
    }

    if (pod.driver_id !== user.id) {
      console.error("[POD_UPLOAD] POD does not belong to this driver")
      return NextResponse.json(
        { success: false, error: "Unauthorized for this POD", code: "POD_FORBIDDEN" },
        { status: 403 },
      )
    }

    console.log("[POD_UPLOAD] POD verified, belongs to driver")

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
        .from(POD_MEDIA_BUCKET)
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
        .from(POD_MEDIA_BUCKET)
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
        .from(POD_MEDIA_BUCKET)
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
        .from(POD_MEDIA_BUCKET)
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
