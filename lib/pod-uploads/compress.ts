/**
 * Client-side image compression for POD photos.
 *
 * Modern smartphones produce 4–12 MP JPEGs (4–11 MB). Re-encoding through a
 * canvas at a sane max edge + ~0.85 JPEG quality typically yields 200–500 KB
 * with no visible quality loss for delivery proof, and removes the entire
 * "memory pressure during fetch" failure mode on mobile.
 *
 * Returns a Blob ready for direct multipart upload. If anything fails we
 * fall back to the original file so we never lose the user's photo.
 */

export interface CompressOptions {
  /** Cap the longest edge to this many pixels. */
  maxEdge?: number
  /** JPEG quality 0..1. */
  quality?: number
  /** Output mime type (defaults to image/jpeg — best for photos). */
  mimeType?: string
}

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 1600,
  quality: 0.85,
  mimeType: "image/jpeg",
}

/**
 * Compress an image File. Returns a Blob (image/jpeg). On any error returns
 * the original file untouched.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<Blob> {
  if (typeof window === "undefined") return file

  const opts = { ...DEFAULTS, ...options }

  // Don't bother compressing tiny images.
  if (file.size < 200_000) return file

  try {
    const bitmap = await createImageBitmapSafe(file)
    const { width: srcW, height: srcH } = bitmap

    let targetW = srcW
    let targetH = srcH
    const longest = Math.max(srcW, srcH)

    if (longest > opts.maxEdge) {
      const scale = opts.maxEdge / longest
      targetW = Math.round(srcW * scale)
      targetH = Math.round(srcH * scale)
    }

    const canvas = document.createElement("canvas")
    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close?.()
      return file
    }

    // High-quality smoothing for downscale.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, opts.mimeType, opts.quality),
    )

    if (!blob || blob.size === 0) return file

    // Sanity check: only swap if the new file is meaningfully smaller.
    return blob.size < file.size ? blob : file
  } catch (err) {
    console.warn("[pod-uploads/compress] compression failed, falling back:", err)
    return file
  }
}

/**
 * createImageBitmap can fail on Safari / older Android for certain mime types.
 * Falls back to <img> + URL.createObjectURL for compatibility.
 */
async function createImageBitmapSafe(file: File): Promise<ImageBitmap | HTMLImageElement & { close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file)
    } catch {
      // fallthrough to <img> path
    }
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      // Free the object URL once decoded.
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image decode failed"))
    }
    img.src = url
  })
}
