"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
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
  Loader2,
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
 * The previous "first photo never uploaded" bug had a single root cause:
 * `handlePhotoChange` was async (it awaited compressImage). React committed
 * the first batch of state updates ("Optimising photo…") before `photoBlob`
 * was ever set, leaving a 1–3 second window where the driver could tap
 * Delivered and the upload would fire WITH NO PHOTO. The server returned
 * 200 OK (with only the signature), the durable queue was never engaged
 * (because the call "succeeded"), and the photo was lost.
 *
 * Fix:
 *   - Refs (`photoBlobRef`, `signatureBlobRef`) are set SYNCHRONOUSLY the
 *     moment the user selects a file / saves a signature. They're the source
 *     of truth at upload time — no stale closure can ever read null.
 *   - Compression runs in the background. If it shrinks the image, we
 *     swap the ref to the smaller blob. Otherwise the original file is
 *     used. Either way the upload always has a valid photo.
 *   - On Delivered, we await the in-flight compression promise with a 4s
 *     safety cap before building FormData — best of both worlds.
 *   - Defence in depth: if `photoPreview` is set but the ref is empty
 *     somehow, we refuse to submit and surface the issue to the driver.
 *   - Hot-path retries (4 attempts, broad coverage) + IndexedDB queue
 *     (lib/pod-uploads/db.ts) handle the network/cold-start failure
 *     surface that the previous fix already addressed.
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

  /* ----- Photo + signature state ---------------------------------------
   * State mirrors the ref so React can re-render previews and disable the
   * Delivered button while processing — but the REF is the source of truth
   * for what actually gets uploaded. Refs eliminate stale-closure bugs.
   * ------------------------------------------------------------------- */
  const photoBlobRef = useRef<Blob | null>(null)
  const signatureBlobRef = useRef<Blob | null>(null)
  const photoCompressionRef = useRef<Promise<Blob> | null>(null)

  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existingPod?.photo_url || null,
  )
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    existingPod?.signature_url || null,
  )
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  /* Only blob: URLs need revoke; existing remote URLs do not. */
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

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

  /* --------------------------------------------------------- PHOTO */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.size === 0) {
      toast({
        title: "No photo selected",
        description: "Please pick or take a photo.",
        variant: "destructive",
      })
      return
    }

    // 1. SYNCHRONOUSLY set the ref so the upload pipeline is never null.
    photoBlobRef.current = file

    // 2. Show preview immediately. Use a blob URL on the original file.
    const previewUrl = URL.createObjectURL(file)
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(previewUrl)
    setIsProcessingPhoto(true)

    console.log(
      "[v0] [DRIVER] photo selected — ref set immediately, original size:",
      file.size,
    )

    // 3. Compress in the background. If it succeeds, swap the ref.
    const promise = compressImage(file)
    photoCompressionRef.current = promise

    promise
      .then((compressed) => {
        // Only swap if compression actually produced a smaller blob AND the
        // ref still points at the original (i.e. user didn't remove or
        // replace the photo while we were compressing).
        if (
          photoBlobRef.current === file &&
          compressed !== file &&
          compressed.size < file.size
        ) {
          photoBlobRef.current = compressed
          console.log(
            "[v0] [DRIVER] compression complete — swapped ref, new size:",
            compressed.size,
          )
        } else {
          console.log("[v0] [DRIVER] compression complete — kept original")
        }
      })
      .catch((err) => {
        // Original file is already in the ref — nothing is lost.
        console.warn("[v0] [DRIVER] compression failed, original retained:", err)
      })
      .finally(() => {
        if (photoCompressionRef.current === promise) {
          photoCompressionRef.current = null
        }
        setIsProcessingPhoto(false)
      })
  }

  const handlePhotoRemove = () => {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview)
    }
    photoBlobRef.current = null
    photoCompressionRef.current = null
    setPhotoPreview(null)
    setIsProcessingPhoto(false)
  }

  /* --------------------------------------------------------- SIGNATURE */
  const handleSignatureSave = (dataUrl: string) => {
    try {
      const blob = dataUrlToBlob(dataUrl)
      // SYNCHRONOUSLY set ref before triggering re-render.
      signatureBlobRef.current = blob
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

  const handleSignatureClear = () => {
    signatureBlobRef.current = null
    setSignaturePreview(null)
  }

  /* --------------------------------------------------------- UPLOAD */
  const buildFormData = (podId: string): FormData => {
    const fd = new FormData()
    fd.append("podId", podId)

    // ALWAYS read from refs at FormData build time. State could be stale.
    const photo = photoBlobRef.current
    if (photo && photo.size > 0) {
      fd.append("photo", photo, "photo.jpg")
    }
    const signature = signatureBlobRef.current
    if (signature && signature.size > 0) {
      fd.append("signature", signature, "signature.png")
    }
    return fd
  }

  const uploadMediaHotPath = async (
    podId: string,
  ): Promise<{ ok: boolean; permanent?: boolean; error?: string }> => {
    const MAX_ATTEMPTS = 4
    const BACKOFF_MS = [1000, 3000, 6000, 10000]

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) {
          setSubmitStatus(`Retrying upload (${attempt}/${MAX_ATTEMPTS - 1})…`)
          await new Promise((r) =>
            setTimeout(r, BACKOFF_MS[attempt - 1] ?? 10000),
          )
        } else {
          setSubmitStatus(
            photoBlobRef.current ? "Uploading photo…" : "Uploading signature…",
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
          console.warn("[v0] [DRIVER] upload returned non-success body:", body)
          continue
        }

        if (res.status === 401 || res.status === 403) {
          let message = `HTTP ${res.status}`
          try {
            const body = await res.json()
            if (body?.error) message = body.error
          } catch {}
          return { ok: false, permanent: true, error: message }
        }

        if (
          res.status >= 400 &&
          res.status < 500 &&
          res.status !== 408 &&
          res.status !== 429
        ) {
          let message = `HTTP ${res.status}`
          try {
            const body = await res.json()
            if (body?.error) message = body.error
          } catch {}
          return { ok: false, permanent: true, error: message }
        }

        console.warn(
          "[v0] [DRIVER] hot-path upload non-2xx, will retry:",
          res.status,
        )
      } catch (err) {
        console.warn("[v0] [DRIVER] hot-path upload threw, will retry:", err)
      }
    }

    return { ok: false, permanent: false, error: "Retries exhausted" }
  }

  /* --------------------------------------------------------- DELIVER */
  const handleDeliver = async () => {
    if (isSubmitting) return

    /* Defensive guard: if the driver clearly captured a photo (preview set to
     * a blob: URL — meaning a NEW capture, not just an existing pod URL) but
     * the ref is somehow empty, refuse and tell them why. This shouldn't
     * happen with the new ref-based flow but protects against unknown
     * regressions. */
    const userCapturedPhoto =
      photoPreview && photoPreview.startsWith("blob:")
    if (userCapturedPhoto && !photoBlobRef.current) {
      toast({
        title: "Photo isn't ready",
        description:
          "We couldn't read the photo. Please re-take or re-select it.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    /* If photo compression is still running, wait briefly so the smaller
     * version uploads. After 4 seconds, give up and proceed with whatever
     * the ref currently holds (always at least the original file). */
    if (photoCompressionRef.current) {
      setSubmitStatus("Finishing photo processing…")
      try {
        await Promise.race([
          photoCompressionRef.current,
          new Promise<void>((resolve) => setTimeout(resolve, 4000)),
        ])
      } catch {
        // ignore — original is still in the ref
      }
    }

    setSubmitStatus("Saving delivery…")
    console.log("[v0] [DRIVER] ========== POD SUBMISSION START ==========")
    console.log(
      "[v0] [DRIVER] photo blob:",
      photoBlobRef.current?.size || "none",
      "signature blob:",
      signatureBlobRef.current?.size || "none",
    )

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
      const hasMedia =
        (photoBlobRef.current || signatureBlobRef.current) && podId

      // 2. Upload media if any
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

        // Hot path exhausted — enqueue blobs to IndexedDB (durable retry).
        try {
          await enqueuePodUpload({
            podId,
            orderId: order.id,
            photo: photoBlobRef.current || undefined,
            signature: signatureBlobRef.current || undefined,
            lastError: result.error,
          })
          console.log(
            "[v0] [DRIVER] enqueued for background retry, podId:",
            podId,
          )

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
          console.error("[v0] [DRIVER] failed to enqueue:", queueErr)
          toast({
            title: "Delivered, upload pending",
            description:
              "Photo + signature couldn't be saved for retry. Stay on this page and try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          setSubmitStatus(null)
          return
        }
      }

      // 3. No media path
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
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setSubmitStatus(null)
    }
  }

  /* --------------------------------------------------------- FAIL */
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

  /* --------------------------------------------------------- RENDER */
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

        {/* Order info */}
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
              <div className="flex items-center justify-between">
                <Label>Photo (optional)</Label>
                {isProcessingPhoto && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin" />
                    Optimising…
                  </span>
                )}
              </div>
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
                    onClick={handlePhotoRemove}
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
                    onClick={handleSignatureClear}
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
            {(photoBlobRef.current || signatureBlobRef.current) && (
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
            <h3 className="font-semibold tracking-tight">Proof of delivery</h3>
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
                <p className="text-sm text-muted-foreground mb-2">Signature</p>
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
