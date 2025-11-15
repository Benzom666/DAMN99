"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Camera, PenTool, CheckCircle, XCircle, X } from 'lucide-react'
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(existingPod?.photo_urls || existingPod?.photo_url ? [existingPod.photo_url] : [])
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(existingPod?.signature_url || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)

  const isCompleted = order.status === "delivered" || order.status === "failed"
  const MAX_PHOTOS = 4

  useEffect(() => {
    if (!isCompleted && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
          console.log("[v0] [GPS] Location captured:", position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error("[v0] [GPS] Location error:", error.message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
  }, [isCompleted])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (photoFiles.length + files.length > MAX_PHOTOS) {
      toast({
        title: "Too many photos",
        description: `You can only upload up to ${MAX_PHOTOS} photos per order.`,
        variant: "destructive",
      })
      return
    }

    const newPhotoFiles = [...photoFiles, ...files].slice(0, MAX_PHOTOS)
    setPhotoFiles(newPhotoFiles)

    // Generate previews for new files
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string].slice(0, MAX_PHOTOS))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureData(dataUrl)
    setShowSignaturePad(false)
  }

  const uploadPhotoToBlob = async (file: File, index: number): Promise<string> => {
    console.log(`[v0] [UPLOAD] Starting upload for photo ${index + 1}, size:`, file.size)
    setUploadProgress(`Uploading photo ${index + 1}/${photoFiles.length}...`)

    // Convert to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === "string") {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      reader.onerror = () => reject(new Error("File reading error"))
      reader.readAsDataURL(file)
    })

    // Upload to blob storage via our API
    const uploadResponse = await fetch("/api/upload-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoData: base64, orderId: order.id, photoIndex: index }),
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed for photo ${index + 1}`)
    }

    const { url } = await uploadResponse.json()
    console.log(`[v0] [UPLOAD] Photo ${index + 1} uploaded successfully:`, url)
    return url
  }

  const handleDeliver = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setUploadProgress("Starting...")
    console.log("[v0] [DRIVER] ========== POD SUBMISSION START ==========")

    try {
      const photoUrls: string[] = []
      
      if (photoFiles.length > 0) {
        console.log("[v0] [DRIVER] Uploading", photoFiles.length, "photos one by one...")
        
        for (let i = 0; i < photoFiles.length; i++) {
          try {
            const url = await uploadPhotoToBlob(photoFiles[i], i)
            photoUrls.push(url)
          } catch (error) {
            console.error(`[v0] [DRIVER] Photo ${i + 1} upload failed:`, error)
            toast({
              title: "Upload Failed",
              description: `Failed to upload photo ${i + 1}. Please try again.`,
              variant: "destructive",
            })
            setIsSubmitting(false)
            setUploadProgress("")
            return
          }
        }
        console.log("[v0] [DRIVER] All photos uploaded successfully")
      }

      let signatureUrl: string | undefined
      if (signatureData && signatureData !== existingPod?.signature_url) {
        setUploadProgress("Uploading signature...")
        console.log("[v0] [DRIVER] Uploading signature...")
        
        try {
          const uploadResponse = await fetch("/api/upload-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              photoData: signatureData, 
              orderId: order.id, 
              photoIndex: 'signature' 
            }),
          })

          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json()
            signatureUrl = url
            console.log("[v0] [DRIVER] Signature uploaded:", url)
          }
        } catch (error) {
          console.error("[v0] [DRIVER] Signature upload failed:", error)
          // Continue anyway - signature is optional
        }
      }

      setUploadProgress("Finalizing delivery...")
      console.log("[v0] [DRIVER] Calling delivery API with URLs...")

      const response = await fetch("/api/driver/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          photoUrls, // Just URLs now, not base64
          signatureUrl,
          notes: notes || undefined,
          recipientName: recipientName || undefined,
          location: location || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to mark as delivered")
      }

      console.log("[v0] [DRIVER] ✅ Delivery marked successfully!")
      setUploadProgress("Complete!")
      
      toast({
        title: "Success",
        description: "Delivery marked as complete!",
      })

      // Navigate after 1.5 seconds
      setTimeout(() => {
        window.location.href = `/driver/routes/${routeId}?t=${Date.now()}`
      }, 1500)
    } catch (error) {
      console.error("[v0] [DRIVER] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setUploadProgress("")
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

    if (isSubmitting) return

    setIsSubmitting(true)
    setUploadProgress("Starting...")
    console.log("[v0] [DRIVER] ========== FAILED DELIVERY START ==========")

    try {
      const photoUrls: string[] = []
      
      if (photoFiles.length > 0) {
        console.log("[v0] [DRIVER] Uploading", photoFiles.length, "photos for failed delivery...")
        
        for (let i = 0; i < photoFiles.length; i++) {
          try {
            const url = await uploadPhotoToBlob(photoFiles[i], i)
            photoUrls.push(url)
          } catch (error) {
            console.error(`[v0] [DRIVER] Photo ${i + 1} upload failed:`, error)
            toast({
              title: "Upload Failed",
              description: `Failed to upload photo ${i + 1}. Please try again.`,
              variant: "destructive",
            })
            setIsSubmitting(false)
            setUploadProgress("")
            return
          }
        }
      }

      let signatureUrl: string | undefined
      if (signatureData && signatureData !== existingPod?.signature_url) {
        setUploadProgress("Uploading signature...")
        
        try {
          const uploadResponse = await fetch("/api/upload-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              photoData: signatureData, 
              orderId: order.id, 
              photoIndex: 'signature' 
            }),
          })

          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json()
            signatureUrl = url
          }
        } catch (error) {
          console.error("[v0] [DRIVER] Signature upload failed:", error)
        }
      }

      setUploadProgress("Finalizing...")
      
      const response = await fetch("/api/driver/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          photoUrls,
          signatureUrl,
          notes,
          location: location || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status")
      }

      console.log("[v0] [DRIVER] ✅ Marked as failed successfully!")
      setUploadProgress("Complete!")
      
      toast({
        title: "Success",
        description: "Delivery marked as failed.",
      })

      setTimeout(() => {
        window.location.href = `/driver/routes/${routeId}?t=${Date.now()}`
      }, 1500)
    } catch (error) {
      console.error("[v0] [DRIVER] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setUploadProgress("")
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
            {/* Photo Capture - Support up to 4 photos */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Photos (Optional)</Label>
                <span className="text-sm text-muted-foreground">{photoPreviews.length}/{MAX_PHOTOS}</span>
              </div>
              
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview || "/placeholder.svg"} alt={`Delivery proof ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemovePhoto(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {photoPreviews.length < MAX_PHOTOS && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-input"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="photo-input">
                    <Button variant="outline" className="w-full bg-transparent" asChild disabled={isSubmitting}>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo or Choose from Gallery {photoPreviews.length > 0 && `(${MAX_PHOTOS - photoPreviews.length} remaining)`}
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
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setSignatureData(null)} disabled={isSubmitting}>
                    Clear Signature
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowSignaturePad(true)} disabled={isSubmitting}>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" size="lg" onClick={handleFail} disabled={isSubmitting}>
                <XCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? uploadProgress || "Processing..." : "Failed"}
              </Button>
              <Button className="flex-1" size="lg" onClick={handleDeliver} disabled={isSubmitting}>
                <CheckCircle className="h-5 w-5 mr-2" />
                {isSubmitting ? uploadProgress || "Processing..." : "Delivered"}
              </Button>
            </div>
          </>
        )}

        {isCompleted && existingPod && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Proof of Delivery</h3>
            {(existingPod.photo_urls && existingPod.photo_urls.length > 0) && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Photos</p>
                <div className="grid grid-cols-2 gap-2">
                  {existingPod.photo_urls.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Delivery proof ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
            {!existingPod.photo_urls && existingPod.photo_url && (
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
            {(existingPod.delivery_latitude && existingPod.delivery_longitude) && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Delivery Location</p>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <p className="text-sm font-mono">
                    {Number(existingPod.delivery_latitude).toFixed(6)}, {Number(existingPod.delivery_longitude).toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${existingPod.delivery_latitude},${existingPod.delivery_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-block"
                  >
                    View on Map →
                  </a>
                  {existingPod.delivery_accuracy && (
                    <p className="text-xs text-muted-foreground">
                      Accuracy: ±{Math.round(existingPod.delivery_accuracy)}m
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
