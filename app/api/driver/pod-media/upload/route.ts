import { NextResponse } from "next/server"
import { requireDriver } from "@/lib/security/authorization"
import { validateUUID } from "@/lib/security/input-validation"

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireDriver()
    const formData = await request.formData()
    
    const podId = formData.get("podId") as string
    if (!validateUUID(podId)) {
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
      return NextResponse.json(
        { success: false, error: "POD not found or unauthorized" },
        { status: 403 }
      )
    }

    const updates: { photo_url?: string; signature_url?: string } = {}

    // Upload photo if provided
    const photoFile = formData.get("photo") as File | null
    if (photoFile) {
      const photoExt = photoFile.name.split(".").pop() || "jpg"
      const photoPath = `pod-photos/${podId}-${Date.now()}.${photoExt}`
      
      const { data: photoData, error: photoError } = await supabase.storage
        .from("pod-media")
        .upload(photoPath, photoFile, {
          contentType: photoFile.type,
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

      updates.photo_url = publicUrl
    }

    // Upload signature if provided
    const signatureFile = formData.get("signature") as File | null
    if (signatureFile) {
      const signaturePath = `pod-signatures/${podId}-${Date.now()}.png`
      
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

      updates.signature_url = publicUrl
    }

    // Update POD with URLs
    if (Object.keys(updates).length > 0) {
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
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POD_UPLOAD] Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
