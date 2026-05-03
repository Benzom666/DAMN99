"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Camera, PenTool, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { SignaturePad } from "@/components/signature-pad"
import { useToast } from "@/hooks/use-toast"

interface StopDetailProps {
  order: any
  routeName: string
  routeId: string
  existingPod: any
}

export function StopDetail({ order, routeName, routeId, existingPod }: StopDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPod?.photo_url || null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(existingPod?.signature_url || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const readPhotoForUpload = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please upload an image file.")
    }

    const imageUrl = URL.createObjectURL(file)

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Failed to load photo. Please take it again."))
        img.src = imageUrl
      })

      const maxDimension = 1400
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Photo compression is not available on this device.")
      }

      context.drawImage(image, 0, 0, width, height)

      return await new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to prepare photo. Please try again."))
              return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result)
              } else {
                reject(new Error("Failed to read prepared photo."))
              }
            }
            reader.onerror = () => reject(new Error("Failed to read prepared photo."))
            reader.readAsDataURL(blob)
          },
          "image/jpeg",
          0.72,
        )
      })
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureData(dataUrl)
    setShowSignaturePad(false)
  }

  const handleDeliver = async () => {
    if (isSubmitting) {
      console.log("[v0] [DRIVER] Already submitting, ignoring click")
      return
    }

    setIsSubmitting(true)
    console.log("[v0] [DRIVER] ========== POD SUBMISSION START ==========")
    console.log("[v0] [DRIVER] Order ID:", order.id)
    console.log("[v0] [DRIVER] Has photo:", !!photoFile)
    console.log("[v0] [DRIVER] Has signature:", !!signatureData)
    console.log("[v0] [DRIVER] Recipient:", recipientName || "none")
    console.log("[v0] [DRIVER] Notes:", notes || "none")

    try {
      let photoData: string | undefined
      let signatureDataToSend: string | undefined

      if (photoFile) {
        console.log("[v0] [DRIVER] Reading photo file...")
        console.log("[v0] [DRIVER] Photo file size:", photoFile.size, "bytes")
        console.log("[v0] [DRIVER] Photo file type:", photoFile.type)

        try {
          photoData = await readPhotoForUpload(photoFile)
          console.log("[v0] [DRIVER] Photo prepared successfully, length:", photoData.length)
        } catch (photoError) {
          console.error("[v0] [DRIVER] Photo processing error:", photoError)
          toast({
            title: "Photo Error",
            description: "Failed to process photo. Please try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      if (signatureData && signatureData !== existingPod?.signature_url) {
        console.log("[v0] [DRIVER] Using signature data, length:", signatureData.length)
        signatureDataToSend = signatureData
      }

      console.log("[v0] [DRIVER] Calling delivery API...")
      console.log("[v0] [DRIVER] API endpoint: /api/driver/deliver")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error("[v0] [DRIVER] API call timeout after 30 seconds")
        controller.abort()
      }, 30000) // 30 second timeout

      let response: Response
      try {
        response = await fetch("/api/driver/deliver", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            photoData,
            signatureData: signatureDataToSend,
            notes: notes || undefined,
            recipientName: recipientName || undefined,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error("[v0] [DRIVER] Fetch error:", fetchError)

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          toast({
            title: "Request Timeout",
            description: "The request took too long. Please check your connection and try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Network Error",
            description: "Failed to connect to server. Please check your internet connection.",
            variant: "destructive",
          })
        }
        setIsSubmitting(false)
        console.log("[v0] [DRIVER] ========== POD SUBMISSION END (FETCH ERROR) ==========")
        return
      }

      console.log("[v0] [DRIVER] API response status:", response.status)
      console.log("[v0] [DRIVER] API response ok:", response.ok)

      let result: any
      try {
        const responseText = await response.text()
        console.log("[v0] [DRIVER] API response body:", responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] [DRIVER] Failed to parse response:", parseError)
        toast({
          title: "Server Error",
          description: "Received invalid response from server. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        console.log("[v0] [DRIVER] ========== POD SUBMISSION END (PARSE ERROR) ==========")
        return
      }

      if (!response.ok || !result.success) {
        console.error("[v0] [DRIVER] API error:", result.error)
        toast({
          title: "Delivery Failed",
          description: result.error || "Failed to mark as delivered. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        console.log("[v0] [DRIVER] ========== POD SUBMISSION END (API ERROR) ==========")
        return
      }

      console.log("[v0] [DRIVER] ✅ Delivery marked successfully!")
      console.log("[v0] [DRIVER] ========== POD SUBMISSION END (SUCCESS) ==========")

      toast({
        title: "Success",
        description: "Delivery marked as complete!",
      })

      setTimeout(returnToRoute, 250)
    } catch (error) {
      console.error("[v0] [DRIVER] Unexpected error:", error)
      console.error("[v0] [DRIVER] Error stack:", error instanceof Error ? error.stack : "no stack")

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Unexpected Error",
        description: `Failed to mark as delivered: ${errorMessage}`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      console.log("[v0] [DRIVER] ========== POD SUBMISSION END (EXCEPTION) ==========")
    }
  }

  const handleFail = async () => {
    if (!notes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide a reason for the failed delivery.",
        variant: "destructive",
      })
      return
    }

    if (isSubmitting) {
      console.log("[v0] [DRIVER] Already submitting, ignoring click")
      return
    }

    setIsSubmitting(true)
    console.log("[v0] [DRIVER] ========== FAILED DELIVERY START ==========")
    console.log("[v0] [DRIVER] Order ID:", order.id)
    console.log("[v0] [DRIVER] Notes:", notes)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch("/api/driver/fail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          notes,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status")
      }

      console.log("[v0] [DRIVER] ✅ Marked as failed successfully!")
      console.log("[v0] [DRIVER] ========== FAILED DELIVERY END (SUCCESS) ==========")

      toast({
        title: "Success",
        description: "Delivery marked as failed.",
      })

      setTimeout(returnToRoute, 250)
    } catch (error) {
      console.error("[v0] [DRIVER] Error marking as failed:", error)
      toast({
        title: "Error",
        description: `Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      console.log("[v0] [DRIVER] ========== FAILED DELIVERY END (ERROR) ==========")
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
          <div>
            <h1 className="text-2xl font-bold">Stop #{order.stop_sequence}</h1>
            <p className="text-sm text-muted-foreground">{routeName}</p>
          </div>
        </div>

        {/* Order Info */}
        <Card className="p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-xl font-bold font-mono text-primary">
              {order.order_number || order.id.substring(0, 8).toUpperCase()}
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
              <p className="font-medium">
                <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                  {order.phone}
                </a>
              </p>
            </div>
          )}
          {order.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Delivery Notes</p>
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
            {/* Photo Capture */}
            <Card className="p-4 space-y-3">
              <Label>Photo (Optional)</Label>
              {photoPreview ? (
                <div className="space-y-2">
                  <img src={photoPreview || "/placeholder.svg"} alt="Delivery proof" className="w-full rounded-lg" />
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-input"
                  />
                  <label htmlFor="photo-input">
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </Card>

            {/* Signature Capture */}
            <Card className="p-4 space-y-3">
              <Label>Signature (Optional)</Label>
              {showSignaturePad ? (
                <SignaturePad onSave={handleSignatureSave} onCancel={() => setShowSignaturePad(false)} />
              ) : signatureData ? (
                <div className="space-y-2">
                  <img
                    src={signatureData || "/placeholder.svg"}
                    alt="Signature"
                    className="w-full border rounded-lg bg-white"
                  />
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setSignatureData(null)}>
                    Clear Signature
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowSignaturePad(true)}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Capture Signature
                </Button>
              )}
            </Card>

            {/* Recipient Name */}
            <Card className="p-4 space-y-3">
              <Label htmlFor="recipient">Recipient Name (Optional)</Label>
              <Input
                id="recipient"
                placeholder="Who received the delivery?"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </Card>

            {/* Notes */}
            <Card className="p-4 space-y-3">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this delivery..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" size="lg" onClick={handleFail} disabled={isSubmitting}>
                <XCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? "Processing..." : "Failed"}
              </Button>
              <Button className="flex-1" size="lg" onClick={handleDeliver} disabled={isSubmitting}>
                <CheckCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? "Processing..." : "Delivered"}
              </Button>
            </div>
          </>
        )}

        {isCompleted && existingPod && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Proof of Delivery</h3>
            {existingPod.photo_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Photo</p>
                <img
                  src={existingPod.photo_url || "/placeholder.svg"}
                  alt="Delivery proof"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {existingPod.signature_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Signature</p>
                <img
                  src={existingPod.signature_url || "/placeholder.svg"}
                  alt="Signature"
                  className="w-full border rounded-lg bg-white"
                />
              </div>
            )}
            {existingPod.recipient_name && (
              <div>
                <p className="text-sm text-muted-foreground">Received By</p>
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
