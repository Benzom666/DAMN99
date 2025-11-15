import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { requireDriver } from "@/lib/security/authorization"

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
    await requireDriver()

    const body = await request.json()
    const { photoData, orderId, photoIndex } = body

    if (!photoData) {
      return NextResponse.json({ error: "No photo data provided" }, { status: 400 })
    }

    const photoBlob = base64ToBlob(photoData)
    const isSignature = photoIndex === 'signature'
    const filename = isSignature 
      ? `pod-signatures/${orderId}-${Date.now()}.png`
      : `pod-photos/${orderId}-${Date.now()}-${photoIndex}.jpg`

    const uploaded = await put(filename, photoBlob, {
      access: "public",
      contentType: isSignature ? "image/png" : "image/jpeg",
    })

    console.log("[v0] [UPLOAD-API] Uploaded:", uploaded.url)

    return NextResponse.json({ success: true, url: uploaded.url })
  } catch (error) {
    console.error("[v0] [UPLOAD-API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
