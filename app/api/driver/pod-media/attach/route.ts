import { NextResponse } from "next/server"
import { requireDriver } from "@/lib/security/authorization"
import { validateUUID } from "@/lib/security/input-validation"

function isPublicBlobUrl(value: unknown): value is string {
  if (typeof value !== "string") return false

  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com")
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireDriver()
    const body = await request.json()

    const podId = typeof body.podId === "string" ? body.podId : ""
    if (!validateUUID(podId)) {
      return NextResponse.json({ success: false, error: "Invalid POD ID" }, { status: 400 })
    }

    const updates: { photo_url?: string; signature_url?: string } = {}
    if (isPublicBlobUrl(body.photoUrl)) updates.photo_url = body.photoUrl
    if (isPublicBlobUrl(body.signatureUrl)) updates.signature_url = body.signatureUrl

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid media URL supplied" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("pods")
      .update(updates)
      .eq("id", podId)
      .eq("driver_id", user.id)
      .select("id")
      .maybeSingle()

    if (error || !data) {
      console.error("[v0] [POD_MEDIA_ATTACH] Failed to attach POD media:", error)
      return NextResponse.json(
        { success: false, error: error ? error.message : "POD was not available for this driver" },
        { status: error ? 500 : 403 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to attach POD media" },
      { status: 500 },
    )
  }
}
