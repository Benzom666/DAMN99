"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoSlot {
  id: string
  file: File | null
  preview: string | null
  uploading: boolean
}

interface MultiPhotoUploadProps {
  maxPhotos?: number
  onPhotosChange: (photos: File[]) => void
  existingPhotos?: string[]
  disabled?: boolean
}

export function MultiPhotoUpload({
  maxPhotos = 4,
  onPhotosChange,
  existingPhotos = [],
  disabled = false,
}: MultiPhotoUploadProps) {
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => {
    // Initialize with existing photos
    const slots: PhotoSlot[] = []
    for (let i = 0; i < maxPhotos; i++) {
      slots.push({
        id: `slot-${i}`,
        file: null,
        preview: existingPhotos[i] || null,
        uploading: false,
      })
    }
    return slots
  })

  useEffect(() => {
    const files = photoSlots.filter((slot) => slot.file).map((slot) => slot.file!)
    onPhotosChange(files)
  }, [photoSlots, onPhotosChange])

  const handlePhotoChange = (index: number, file: File | null) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoSlots((prev) => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            file,
            preview: reader.result as string,
          }
          return updated
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoSlots((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        file: null,
        preview: null,
      }
      return updated
    })
  }

  const uploadedCount = photoSlots.filter((slot) => slot.file || slot.preview).length
  const remainingSlots = maxPhotos - uploadedCount

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
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
                  disabled={disabled}
                />
                <label htmlFor={`photo-input-${index}`}>
                  <Card
                    className={cn(
                      "h-32 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-colors",
                      disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-accent/50",
                    )}
                  >
                    <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Photo {index + 1}</span>
                  </Card>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {uploadedCount === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Tap any slot to add a photo. You can upload up to {maxPhotos} photos.
        </p>
      )}
    </div>
  )
}
