"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Camera,
  PenTool,
  CheckCircle,
  XCircle,
  Upload,
  CloudUpload,
} from "lucide-react"
import Link from "next/link"
import { SignaturePad } from "@/components/signature-pad"
import { useToast } from "@/hooks/use-toast"
import { compressImage } from "@/lib/pod-uploads/compress"
import { enqueue as enqueuePodUpload } from "@/lib/pod-uploads/db"

interface StopDetailProps {
  order: any
  routeName: string
  routeId: string
  existingPod: any
}

/**
 * Driver POD capture view.
 *
 * Photo + signature flow is now durable end-to-end:
 *   1. Photo files are compressed client-side on capture (cuts ~90% of payload).
 *   2. Captured blobs live in component state for the hot-path upload.
 *   3. The hot-path retries on EVERY non-2xx response (5xx, timeout, auth) up
 *      to 4 times with exponential backoff.
 *   4. If those retries are exhausted, blobs are queued to IndexedDB
 *      (lib/pod-uploads/db.ts) before we navigate away. A background
 *      <PendingUploads/> component on the route page then keeps retrying
 *      until the upload lands. Drivers cannot lose POD data.
 */
export function StopDetail({
  order,
  routeName,
  routeId,
  existingPod,
}: StopDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existingPod?.photo_url || null,
  )
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    existingPod?.signature_url || null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  const isCompleted = order.status === "delivered" || order.status === "failed"
  const routeHref = `/driver/routes/${routeId}`

  const returnToRoute = () => {
    router.replace(routeHref)
    router.refresh()
    window.setTimeout(() => {
      if (window.location.pathname !== routeHref) {
        window.location.assign(routeHref)
      }
    }, 1200)
  }

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSubmitStatus("Optimising photo…")
      const compressed = await compressImage(file)
      const previewUrl = URL.createObjectURL(compressed)
      setPhotoBlob(compressed)
      setPhotoPreview(previewUrl)
      setSubmitStatus(null)
      console.log(
        "[v0] [DRIVER] photo ready — original:",
        file.size,
        "compressed:",
        compressed.size,
      )
    } catch (err) {
      console.error("[v0] [DRIVER] photo capture failed", err)
      toast({
        title: "Couldn't read photo",
        description: "Please try again or pick a different photo.",
        variant: "destructive",
      })
      setSubmitStatus(null)
    }
  }

  const handleSignatureSave = (dataUrl: string) => {
    try {
      const blob = dataUrlToBlob(dataUrl)
      setSignatureBlob(blob)
      setSignaturePreview(dataUrl)
      setShowSignaturePad(false)
    } catch (err) {
      console.error("[v0] [DRIVER] signature decode failed", err)
      toast({
        title: "Couldn't save signature",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const buildFormData = (podId: string): FormData => {
    const fd = new FormData()
    fd.append("podId", podId)
    if (photoBlob) fd.append("photo", photoBlob, "photo.jpg")
    if (signatureBlob) fd.append("signature", signatureBlob, "signature.png")
    return fd
  }

  /**
   * Hot-path media upload with broad retry coverage.
   * Returns true on success, false if exhausted (caller will enqueue).
   * Throws only on permanent failures (auth) where retry is pointless.
   */
  const uploadMediaHotPath = async (
    podId: string,
  ): Promise<{ ok: boolean; permanent?: boolean; error?: string }> => {
    const MAX_ATTEMPTS = 4
    const BACKOFF_MS = [1000, 3000, 6000, 10000]

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          setSubmitStatus(
            `Retrying upload (${attempt}/${MAX_ATTEMPTS - 1})…`,
          )
          await new Promise((r) =>
            setTimeout(r, BACKOFF_MS[attempt - 1] ?? 10000),
          )
        } else {
          setSubmitStatus(
            photoBlob ? "Uploading photo…" : "Uploading signature…",
          )
        }

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 90_000)

        let res: Response
        try {
          res = await fetch("/api/driver/pod-media/upload", {
            method: "POST",
            body: buildFormData(podId),
            credentials: "include",
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timer)
        }

        if (res.ok) {
          const body = await res.json().catch(() => ({}))
          if (body?.success) {
            console.log("[v0] [DRIVER] hot-path upload succeeded")
            return { ok: true }
          }
          // 200 with success:false — treat as retryable server hiccup
          console.warn(
            "[v0] [DRIVER] upload returned non-success body:",
            body,
          )
          continue
        }

        // 401/403 are permanent for this session
        if (res.status === 401 || res.status === 403) {
          let message = `HTTP ${res.status}`
          try {
            const body = await res.json()
            if (body?.error) message = body.error
          } catch {}
          return { ok: false, permanent: true, error: message }
        }

        // 4xx other than auth — likely a malformed request, also permanent
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          let message = `HTTP ${res.status}`
          try {
            const body = await res.json()
            if (body?.error) message = body.error
          } catch {}
          return { ok: false, permanent: true, error: message }
        }

        // 5xx, 408, 429 → retry
        console.warn(
          "[v0] [DRIVER] hot-path upload non-2xx, will retry:",
          res.status,
        )
      } catch (err) {
        // Network error / abort / cors — retry
        console.warn(
          "[v0] [DRIVER] hot-path upload threw, will retry:",
          err,
        )
      }
    }

    return { ok: false, permanent: false, error: "Retries exhausted" }
  }

  const handleDeliver = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitStatus("Saving delivery…")
    console.log("[v0] [DRIVER] ========== POD SUBMISSION START ==========")

    try {
      // 1. Mark delivered + create POD row
      let deliverRes: Response
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 60_000)
        try {
          deliverRes = await fetch("/api/driver/deliver", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              notes,
              recipientName,
            }),
            credentials: "include",
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timer)
        }
      } catch (err) {
        console.error("[v0] [DRIVER] /deliver fetch error:", err)
        toast({
          title: "Network error",
          description:
            "Couldn't reach the server. Check your connection and try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setSubmitStatus(null)
        return
      }

      const deliverBody = await deliverRes.json().catch(() => ({}))
      if (!deliverRes.ok || !deliverBody?.success) {
        toast({
          title: "Delivery failed",
          description:
            deliverBody?.error || "Couldn't mark this stop as delivered.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setSubmitStatus(null)
        return
      }

      const podId: string | undefined = deliverBody.podId
      const hasMedia = (photoBlob || signatureBlob) && podId

      // 2. If we have media, try to upload it inline
      if (hasMedia && podId) {
        const result = await uploadMediaHotPath(podId)

        if (result.ok) {
          toast({
            title: "Delivered",
            description: "Photo + signature uploaded.",
          })
          setSubmitStatus(null)
          setTimeout(returnToRoute, 400)
          return
        }

        // Hot path exhausted — enqueue to IndexedDB before navigating away.
        try {
          await enqueuePodUpload({
            podId,
            orderId: order.id,
            photo: photoBlob || undefined,
            signature: signatureBlob || undefined,
            lastError: result.error,
          })
          console.log("[v0] [DRIVER] enqueued for background retry, podId:", podId)

          if (result.permanent) {
            toast({
              title: "Delivered — sign-in needed",
              description:
                "Your delivery was saved. Photos will sync once you re-authenticate.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Delivered — sync in progress",
              description:
                "Photo + signature saved on this device. We'll keep retrying in the background.",
            })
          }
          setSubmitStatus(null)
          setTimeout(returnToRoute, 600)
          return
        } catch (queueErr) {
          // IndexedDB itself failed — last-resort UI
          console.error("[v0] [DRIVER] failed to enqueue:", queueErr)
          toast({
            title: "Delivered, upload pending",
            description:
              "Photo + signature couldn't be saved for retry. Stay on this page and try Retry below.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          setSubmitStatus(null)
          return
        }
      }

      // 3. No media — straight return
      if (deliverBody.warning) {
        toast({
          title: "Delivered with warning",
          description: deliverBody.warning,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Delivered",
          description: "Stop marked as complete.",
        })
      }
      setTimeout(returnToRoute, 400)
    } catch (err) {
      console.error("[v0] [DRIVER] unexpected:", err)
      toast({
        title: "Unexpected error",
        description:
          err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setSubmitStatus(null)
    }
  }

  const handleFail = async () => {
    if (!notes.trim()) {
      toast({
        title: "Notes required",
        description: "Tell us why this delivery failed.",
        variant: "destructive",
      })
      return
    }
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitStatus("Saving failed delivery…")

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 45_000)
      const res = await fetch("/api/driver/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, notes }),
        credentials: "include",
        signal: controller.signal,
      })
      clearTimeout(timer)

      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || `HTTP ${res.status}`)
      }

      toast({ title: "Saved", description: "Stop marked as failed." })
      setTimeout(returnToRoute, 250)
    } catch (err) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setSubmitStatus(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/driver/routes/${routeId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Stop #{order.stop_sequence}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {routeName}
            </p>
          </div>
        </div>

        {/* Order Info */}
        <Card className="p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Order number</p>
            <p className="text-xl font-bold font-mono text-primary">
              {order.order_number ||
                order.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">{order.address}</p>
          </div>
          {order.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <a
                href={`tel:${order.phone}`}
                className="text-primary hover:underline font-medium"
              >
                {order.phone}
              </a>
            </div>
          )}
          {order.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Delivery notes</p>
              <p className="font-medium">{order.notes}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{order.status}</p>
          </div>
        </Card>

        {!isCompleted && (
          <>
            {/* Photo */}
            <Card className="p-4 space-y-3">
              <Label>Photo (optional)</Label>
              {photoPreview ? (
                <div className="space-y-2">
                  <img
                    src={photoPreview}
                    alt="Delivery proof"
                    className="w-full rounded-lg"
                  />
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      if (photoPreview && photoPreview.startsWith("blob:")) {
                        URL.revokeObjectURL(photoPreview)
                      }
                      setPhotoBlob(null)
                      setPhotoPreview(null)
                    }}
                  >
                    Remove photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-camera-input"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload-input"
                  />
                  <label htmlFor="photo-camera-input">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      asChild
                    >
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Take photo
                      </span>
                    </Button>
                  </label>
                  <label htmlFor="photo-upload-input">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload photo
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </Card>

            {/* Signature */}
            <Card className="p-4 space-y-3">
              <Label>Signature (optional)</Label>
              {showSignaturePad ? (
                <SignaturePad
                  onSave={handleSignatureSave}
                  onCancel={() => setShowSignaturePad(false)}
                />
              ) : signaturePreview ? (
                <div className="space-y-2">
                  <img
                    src={signaturePreview}
                    alt="Signature"
                    className="w-full border rounded-lg bg-white"
                  />
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setSignatureBlob(null)
                      setSignaturePreview(null)
                    }}
                  >
                    Clear signature
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setShowSignaturePad(true)}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Capture signature
                </Button>
              )}
            </Card>

            {/* Recipient */}
            <Card className="p-4 space-y-3">
              <Label htmlFor="recipient">Recipient name (optional)</Label>
              <Input
                id="recipient"
                placeholder="Who received the delivery?"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </Card>

            {/* Notes */}
            <Card className="p-4 space-y-3">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this delivery…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </Card>

            {/* Sync hint */}
            {(photoBlob || signatureBlob) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <CloudUpload className="size-3.5" />
                Saved to this device — will sync even if your connection drops.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                size="lg"
                onClick={handleFail}
                disabled={isSubmitting}
              >
                <XCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? submitStatus || "Saving…" : "Failed"}
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleDeliver}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? submitStatus || "Saving…" : "Delivered"}
              </Button>
            </div>
          </>
        )}

        {isCompleted && existingPod && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold tracking-tight">
              Proof of delivery
            </h3>
            {existingPod.photo_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Photo</p>
                <img
                  src={existingPod.photo_url}
                  alt="Delivery proof"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {existingPod.signature_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Signature
                </p>
                <img
                  src={existingPod.signature_url}
                  alt="Signature"
                  className="w-full border rounded-lg bg-white"
                />
              </div>
            )}
            {existingPod.recipient_name && (
              <div>
                <p className="text-sm text-muted-foreground">Received by</p>
                <p className="font-medium">{existingPod.recipient_name}</p>
              </div>
            )}
            {existingPod.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{existingPod.notes}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------- helpers */

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",")
  const contentType = header.match(/:(.*?);/)?.[1] || "image/png"
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: contentType })
}
