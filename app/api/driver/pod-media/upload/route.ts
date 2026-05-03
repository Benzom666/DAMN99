import { type HandleUploadBody, handleUpload } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { requireDriver } from "@/lib/security/authorization"
import { validateUUID } from "@/lib/security/input-validation"

type ClientPayload = {
  podId?: string
  mediaKind?: "photo" | "signature"
}

function parseClientPayload(payload: string | null): ClientPayload {
  if (!payload) return {}

  try {
    const parsed = JSON.parse(payload)
    return {
      podId: typeof parsed.podId === "string" ? parsed.podId : undefined,
      mediaKind: parsed.mediaKind === "signature" ? "signature" : "photo",
    }
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const { user, supabase } = await requireDriver()
        const payload = parseClientPayload(clientPayload)
        const expectedPrefix = payload.mediaKind === "signature" ? "pod-signatures/" : "pod-photos/"

        if (!payload.podId || !validateUUID(payload.podId)) {
          throw new Error("Invalid POD ID")
        }

        if (!_pathname.startsWith(expectedPrefix)) {
          throw new Error("Invalid upload path")
        }

        const { data: pod, error } = await supabase
          .from("pods")
          .select("id")
          .eq("id", payload.podId)
          .eq("driver_id", user.id)
          .maybeSingle()

        if (error || !pod) {
          throw new Error("POD was not available for this driver")
        }

        return {
          allowedContentTypes:
            payload.mediaKind === "signature"
              ? ["image/png", "image/jpeg", "image/webp"]
              : ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
          maximumSizeInBytes: payload.mediaKind === "signature" ? 3 * 1024 * 1024 : 20 * 1024 * 1024,
          tokenPayload: JSON.stringify(payload),
        }
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] [POD_MEDIA_UPLOAD] Failed to handle upload token request:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to prepare upload" },
      { status: 400 },
    )
  }
}
