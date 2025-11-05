"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, X, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoSlot {
  id: string
  file: File | null
  preview: string | null
  uploading: boolean
  compressed: boolean
}

interface MultiPhotoUploadProps {
  maxPhotos?: number
  onPhotosChange: (photos: File[]) => void
  existingPhotos?: string[]
  disabled?: boolean
}

async function compressImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })

            console.log(
              `[v0] [COMPRESS] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            )

            resolve(compressedFile)
          },
          "image/jpeg",
          quality,
        )
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export function MultiPhotoUpload({
  maxPhotos = 4,
  onPhotosChange,
  existingPhotos = [],
  disabled = false,
}: MultiPhotoUploadProps) {
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => {
    const slots: PhotoSlot[] = []
    for (let i = 0; i < maxPhotos; i++) {
      slots.push({
        id: `slot-${i}`,
        file: null,
        preview: existingPhotos[i] || null,
        uploading: false,
        compressed: false,
      })
    }
    return slots
  })

  useEffect(() => {
    const files = photoSlots.filter((slot) => slot.file).map((slot) => slot.file!)
    onPhotosChange(files)
  }, [photoSlots, onPhotosChange])

  const handlePhotoChange = async (index: number, file: File | null) => {
    if (file) {
      console.log(`[v0] [UPLOAD] Photo ${index + 1} selected:`, file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`)

      // Show uploading state
      setPhotoSlots((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          uploading: true,
        }
        return updated
      })

      try {
        // Compress image if it's larger than 1MB
        let processedFile = file
        if (file.size > 1024 * 1024) {
          console.log(`[v0] [UPLOAD] Compressing photo ${index + 1}...`)
          processedFile = await compressImage(file)
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotoSlots((prev) => {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              file: processedFile,
              preview: reader.result as string,
              uploading: false,
              compressed: processedFile !== file,
            }
            return updated
          })
        }
        reader.readAsDataURL(processedFile)
      } catch (error) {
        console.error(`[v0] [UPLOAD] Error processing photo ${index + 1}:`, error)
        setPhotoSlots((prev) => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            uploading: false,
          }
          return updated
        })
      }
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoSlots((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        file: null,
        preview: null,
        compressed: false,
      }
      return updated
    })
  }

  const uploadedCount = photoSlots.filter((slot) => slot.file || slot.preview).length
  const remainingSlots = maxPhotos - uploadedCount
  const isProcessing = photoSlots.some((slot) => slot.uploading)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Photos</span>
          <span className="text-xs text-muted-foreground">
            ({uploadedCount}/{maxPhotos})
          </span>
        </div>
        {remainingSlots > 0 && <span className="text-xs text-muted-foreground">{remainingSlots} remaining</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photoSlots.map((slot, index) => (
          <div key={slot.id} className="relative">
            {slot.preview ? (
              <Card className="relative overflow-hidden border-2 border-primary/20">
                <img
                  src={slot.preview || "/placeholder.svg"}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  {slot.compressed && <CheckCircle2 className="h-3 w-3" />}
                  {index + 1}
                </div>
              </Card>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*,image/heic,image/heif"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoChange(index, file)
                  }}
                  className="hidden"
                  id={`photo-input-${index}`}
                  disabled={disabled || slot.uploading}
                />
                <label htmlFor={`photo-input-${index}`}>
                  <Card
                    className={cn(
                      "h-32 flex flex-col items-center justify-center border-2 border-dashed transition-colors",
                      disabled || slot.uploading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-primary hover:bg-accent/50",
                    )}
                  >
                    {slot.uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-1" />
                        <span className="text-xs text-muted-foreground">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Photo {index + 1}</span>
                      </>
                    )}
                  </Card>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {uploadedCount === 0 && !isProcessing && (
        <p className="text-xs text-muted-foreground text-center">
          Tap any slot to add a photo. You can upload up to {maxPhotos} photos.
        </p>
      )}

      {isProcessing && (
        <p className="text-xs text-primary text-center flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Compressing image for faster upload...
        </p>
      )}
    </div>
  )
}
