import { NextResponse } from "next/server"
import { requireDriver } from "@/lib/security/authorization"
import { validateUUID } from "@/lib/security/input-validation"

export async function POST(request: Request) {
  console.log("[POD_UPLOAD] ========== UPLOAD REQUEST START ==========")
  try {
    const { user, supabase } = await requireDriver()
    console.log("[POD_UPLOAD] Driver authenticated:", user.id)
    
    const formData = await request.formData()
    console.log("[POD_UPLOAD] FormData received")
    
    const podId = formData.get("podId") as string
    console.log("[POD_UPLOAD] POD ID:", podId)
    
    if (!validateUUID(podId)) {
      console.error("[POD_UPLOAD] Invalid POD ID")
      return NextResponse.json({ success: false, error: "Invalid POD ID" }, { status: 400 })
    }

    // Verify POD belongs to this driver
    const { data: pod, error: podError } = await supabase
      .from("pods")
      .select("id")
      .eq("id", podId)
      .eq("driver_id", user.id)
      .maybeSingle()

    if (podError || !pod) {
      console.error("[POD_UPLOAD] POD not found or unauthorized:", podError)
      return NextResponse.json(
        { success: false, error: "POD not found or unauthorized" },
        { status: 403 }
      )
    }
    
    console.log("[POD_UPLOAD] POD verified, belongs to driver")

    const updates: { photo_url?: string; signature_url?: string } = {}

    // Upload photo if provided
    const photoFile = formData.get("photo") as File | null
    console.log("[POD_UPLOAD] Photo file:", photoFile ? {
      name: photoFile.name,
      size: photoFile.size,
      type: photoFile.type
    } : "none")
    
    if (photoFile) {
      const photoExt = photoFile.name.split(".").pop() || "jpg"
      const photoPath = `pod-photos/${podId}-${Date.now()}.${photoExt}`
      
      // Mobile browsers sometimes send empty or incorrect contentType
      // Default to image/jpeg if contentType is missing or generic
      let contentType = photoFile.type
      if (!contentType || contentType === "application/octet-stream") {
        contentType = "image/jpeg"
      }
      
      console.log("[POD_UPLOAD] Uploading photo to:", photoPath, "contentType:", contentType)
      
      const { data: photoData, error: photoError } = await supabase.storage
        .from("pod-media")
        .upload(photoPath, photoFile, {
          contentType,
          upsert: false,
        })

      if (photoError) {
        console.error("[POD_UPLOAD] Photo upload failed:", photoError)
        return NextResponse.json(
          { success: false, error: `Photo upload failed: ${photoError.message}` },
          { status: 500 }
        )
      }

      const { data: { publicUrl } } = supabase.storage
        .from("pod-media")
        .getPublicUrl(photoData.path)

      console.log("[POD_UPLOAD] Photo uploaded successfully, URL:", publicUrl)
      updates.photo_url = publicUrl
    }

    // Upload signature if provided
    const signatureFile = formData.get("signature") as File | null
    console.log("[POD_UPLOAD] Signature file:", signatureFile ? {
      name: signatureFile.name,
      size: signatureFile.size,
      type: signatureFile.type
    } : "none")
    
    if (signatureFile) {
      const signaturePath = `pod-signatures/${podId}-${Date.now()}.png`
      
      console.log("[POD_UPLOAD] Uploading signature to:", signaturePath)
      
      const { data: signatureData, error: signatureError } = await supabase.storage
        .from("pod-media")
        .upload(signaturePath, signatureFile, {
          contentType: "image/png",
          upsert: false,
        })

      if (signatureError) {
        console.error("[POD_UPLOAD] Signature upload failed:", signatureError)
        return NextResponse.json(
          { success: false, error: `Signature upload failed: ${signatureError.message}` },
          { status: 500 }
        )
      }

      const { data: { publicUrl } } = supabase.storage
        .from("pod-media")
        .getPublicUrl(signatureData.path)

      console.log("[POD_UPLOAD] Signature uploaded successfully, URL:", publicUrl)
      updates.signature_url = publicUrl
    }

    // Update POD with URLs
    if (Object.keys(updates).length > 0) {
      console.log("[POD_UPLOAD] Updating POD with URLs:", updates)
      
      const { error: updateError } = await supabase
        .from("pods")
        .update(updates)
        .eq("id", podId)
        .eq("driver_id", user.id)

      if (updateError) {
        console.error("[POD_UPLOAD] Failed to update POD:", updateError)
        return NextResponse.json(
          { success: false, error: `Failed to save media URLs: ${updateError.message}` },
          { status: 500 }
        )
      }
      
      console.log("[POD_UPLOAD] POD updated successfully")
    } else {
      console.log("[POD_UPLOAD] No updates to apply")
    }

    console.log("[POD_UPLOAD] ========== UPLOAD REQUEST SUCCESS ==========")
    return NextResponse.json({ success: true, photo_url: updates.photo_url, signature_url: updates.signature_url })
  } catch (error) {
    console.error("[POD_UPLOAD] ========== UPLOAD REQUEST FAILED ==========")
    console.error("[POD_UPLOAD] Unexpected error:", error)
    console.error("[POD_UPLOAD] Error stack:", error instanceof Error ? error.stack : "no stack")
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
