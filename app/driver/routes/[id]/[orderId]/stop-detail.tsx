"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Camera, PenTool, CheckCircle, XCircle, Upload } from "lucide-react"
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
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPod?.photo_url || null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(existingPod?.signature_url || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)
  const [uploadFailed, setUploadFailed] = useState(false)
  const [pendingPodId, setPendingPodId] = useState<string | null>(null)

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
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setPhotoDataUrl(dataUrl)
        setPhotoPreview(dataUrl)
        console.log("[v0] [DRIVER] Photo converted to base64, length:", dataUrl.length)
      }
      reader.onerror = () => {
        console.error("[v0] [DRIVER] Failed to read photo file")
        toast({
          title: "Error",
          description: "Failed to read photo. Please try again.",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const readJsonResponse = async (response: Response) => {
    const responseText = await response.text()
    console.log("[v0] [DRIVER] API response body:", responseText)

    try {
      return responseText ? JSON.parse(responseText) : {}
    } catch {
      return {
        success: false,
        error: response.ok ? "Server returned an invalid response." : responseText || "Request failed.",
      }
    }
  }

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureData(dataUrl)
    setShowSignaturePad(false)
  }

  const getFileExtension = (file: File) => {
    const fromName = file.name.split(".").pop()?.toLowerCase()
    if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName

    if (file.type === "image/png") return "png"
    if (file.type === "image/webp") return "webp"
    if (file.type === "image/heic" || file.type === "image/heif") return "heic"
    return "jpg"
  }

  const dataUrlToBlob = (dataUrl: string) => {
    const [header, data] = dataUrl.split(",")
    const contentType = header.match(/:(.*?);/)?.[1] || "image/png"
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index)
    }

    return new Blob([bytes], { type: contentType })
  }

  const uploadPodMedia = async (podId: string, retryCount = 0): Promise<any> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = [2000, 4000, 8000] // Exponential backoff
    
    try {
      console.log("[v0] [DRIVER] uploadPodMedia starting - podId:", podId, "retry:", retryCount)
      console.log("[v0] [DRIVER] photoDataUrl exists:", !!photoDataUrl, "length:", photoDataUrl?.length)
      console.log("[v0] [DRIVER] signatureData exists:", !!signatureData, "length:", signatureData?.length)
      
      const formData = new FormData()
      formData.append("podId", podId)
      
      if (photoDataUrl) {
        const photoBlob = dataUrlToBlob(photoDataUrl)
        console.log("[v0] [DRIVER] Photo blob created - size:", photoBlob.size, "type:", photoBlob.type)
        formData.append("photo", photoBlob, "photo.jpg")
      }
      
      if (signatureData && signatureData !== existingPod?.signature_url && signatureData.startsWith("data:")) {
        const signatureBlob = dataUrlToBlob(signatureData)
        console.log("[v0] [DRIVER] Signature blob created - size:", signatureBlob.size, "type:", signatureBlob.type)
        formData.append("signature", signatureBlob, "signature.png")
      }

      console.log("[v0] [DRIVER] Sending FormData to /api/driver/pod-media/upload")
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout
      
      const response = await fetch("/api/driver/pod-media/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log("[v0] [DRIVER] Upload response status:", response.status, "ok:", response.ok)
      const result = await readJsonResponse(response)
      console.log("[v0] [DRIVER] Upload result:", result)
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload proof media")
      }

      // Update local state with server URLs
      if (result.photo_url) {
        console.log("[v0] [DRIVER] Updating photoPreview with server URL:", result.photo_url)
        setPhotoPreview(result.photo_url)
        setPhotoDataUrl(null) // Clear the dataURL after successful upload
      }
      if (result.signature_url) {
        console.log("[v0] [DRIVER] Updating signatureData with server URL:", result.signature_url)
        setSignatureData(result.signature_url)
      }

      return result
    } catch (error) {
      console.error("[v0] [DRIVER] uploadPodMedia error:", error, "retry:", retryCount)
      
      // Retry on network errors or timeouts
      if (retryCount < MAX_RETRIES) {
        const isNetworkError = error instanceof Error && 
          (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network'))
        
        if (isNetworkError) {
          console.log("[v0] [DRIVER] Retrying upload in", RETRY_DELAY[retryCount], "ms")
          setSubmitStatus(`Upload failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`)
          
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY[retryCount]))
          return uploadPodMedia(podId, retryCount + 1)
        }
      }
      
      throw error
    }
  }

  const handleDeliver = async () => {
    if (isSubmitting) {
      console.log("[v0] [DRIVER] Already submitting, ignoring click")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("Preparing delivery...")
    console.log("[v0] [DRIVER] ========== POD SUBMISSION START ==========")
    console.log("[v0] [DRIVER] Order ID:", order.id)
    console.log("[v0] [DRIVER] Has photo:", !!photoDataUrl)
    console.log("[v0] [DRIVER] Has signature:", !!signatureData)
    console.log("[v0] [DRIVER] Recipient:", recipientName || "none")
    console.log("[v0] [DRIVER] Notes:", notes || "none")

    try {
      console.log("[v0] [DRIVER] Calling delivery API...")
      console.log("[v0] [DRIVER] API endpoint: /api/driver/deliver")
      setSubmitStatus("Saving delivery...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error("[v0] [DRIVER] API call timeout after 90 seconds")
        controller.abort()
      }, 90000)

      let response: Response
      try {
        response = await fetch("/api/driver/deliver", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            notes,
            recipientName,
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
        setSubmitStatus(null)
        console.log("[v0] [DRIVER] ========== POD SUBMISSION END (FETCH ERROR) ==========")
        return
      }

      console.log("[v0] [DRIVER] API response status:", response.status)
      console.log("[v0] [DRIVER] API response ok:", response.ok)

      const result = await readJsonResponse(response)

      if (!response.ok || !result.success) {
        console.error("[v0] [DRIVER] API error:", result.error)
        toast({
          title: "Delivery Failed",
          description: result.error || "Failed to mark as delivered. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setSubmitStatus(null)
        console.log("[v0] [DRIVER] ========== POD SUBMISSION END (API ERROR) ==========")
        return
      }

      console.log("[v0] [DRIVER] ✅ Delivery marked successfully!")
      
      // Upload media if present - WAIT for completion before navigation
      if (result.podId && (photoDataUrl || (signatureData && signatureData.startsWith("data:")))) {
        setSubmitStatus(photoDataUrl ? "Uploading photo..." : "Uploading proof...")

        try {
          await uploadPodMedia(result.podId)
          console.log("[v0] [DRIVER] ✅ Media uploaded successfully!")
          
          // Success - show toast and navigate
          if (result.warning) {
            toast({
              title: "Delivered with warning",
              description: result.warning,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Success",
              description: "Delivery complete with photo/signature!",
            })
          }
          
          console.log("[v0] [DRIVER] ========== POD SUBMISSION END (SUCCESS) ==========")
          setTimeout(returnToRoute, 500) // Wait for toast to show
          
        } catch (mediaError) {
          console.error("[v0] [DRIVER] POD media upload failed after retries:", mediaError)
          const errorMsg = mediaError instanceof Error ? mediaError.message : String(mediaError)
          
          // Upload failed - stay on page and allow retry
          setIsSubmitting(false)
          setSubmitStatus(null)
          setUploadFailed(true)
          setPendingPodId(result.podId)
          
          toast({
            title: "Upload Failed",
            description: `Delivery was saved, but photo/signature upload failed: ${errorMsg}. You can retry below.`,
            variant: "destructive",
          })
          
          console.log("[v0] [DRIVER] ========== POD SUBMISSION END (MEDIA ERROR - STAYING ON PAGE) ==========")
          // Don't navigate - let driver retry
          return
        }
      } else {
        // No media to upload
        console.log("[v0] [DRIVER] ⚠️ No media to upload")
        console.log("[v0] [DRIVER] ========== POD SUBMISSION END (SUCCESS - NO MEDIA) ==========")
        
        if (result.warning) {
          toast({
            title: "Delivered with warning",
            description: result.warning,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Success",
            description: "Delivery marked as complete!",
          })
        }
        
        setTimeout(returnToRoute, 500)
      }
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
      setSubmitStatus(null)
      console.log("[v0] [DRIVER] ========== POD SUBMISSION END (EXCEPTION) ==========")
    }
  }

  const handleRetryUpload = async () => {
    if (!pendingPodId) return
    
    setIsSubmitting(true)
    setUploadFailed(false)
    setSubmitStatus("Retrying upload...")
    
    try {
      await uploadPodMedia(pendingPodId)
      console.log("[v0] [DRIVER] ✅ Retry upload successful!")
      
      toast({
        title: "Success",
        description: "Photo/signature uploaded successfully!",
      })
      
      setPendingPodId(null)
      setTimeout(returnToRoute, 500)
    } catch (error) {
      console.error("[v0] [DRIVER] Retry upload failed:", error)
      setIsSubmitting(false)
      setSubmitStatus(null)
      setUploadFailed(true)
      
      toast({
        title: "Retry Failed",
        description: `Upload still failing: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
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
    setSubmitStatus("Saving failed delivery...")
    console.log("[v0] [DRIVER] ========== FAILED DELIVERY START ==========")
    console.log("[v0] [DRIVER] Order ID:", order.id)
    console.log("[v0] [DRIVER] Notes:", notes)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)

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

      const result = await readJsonResponse(response)

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
      setSubmitStatus(null)
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
                      setPhotoDataUrl(null)
                      setPhotoPreview(null)
                      setSubmitStatus(null)
                    }}
                  >
                    Remove Photo
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
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </span>
                    </Button>
                  </label>
                  <label htmlFor="photo-upload-input">
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
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
            {uploadFailed && pendingPodId ? (
              <Card className="p-4 space-y-3 border-destructive">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive">Upload Failed</p>
                    <p className="text-sm text-muted-foreground">
                      Delivery was saved, but photo/signature upload failed. Check your connection and retry.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={returnToRoute}>
                    Skip Upload
                  </Button>
                  <Button className="flex-1" onClick={handleRetryUpload} disabled={isSubmitting}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isSubmitting ? submitStatus || "Retrying..." : "Retry Upload"}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex gap-3">
                <Button variant="destructive" className="flex-1" size="lg" onClick={handleFail} disabled={isSubmitting}>
                  <XCircle className="h-5 w-5 mr-2" />
                  {isSubmitting ? submitStatus || "Processing..." : "Failed"}
                </Button>
                <Button className="flex-1" size="lg" onClick={handleDeliver} disabled={isSubmitting}>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {isSubmitting ? submitStatus || "Processing..." : "Delivered"}
                </Button>
              </div>
            )}
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
