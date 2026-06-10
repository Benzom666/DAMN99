"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

/**
 * SignaturePad — hardened against the "blank / invalid signature" failure mode.
 *
 * Previous bug: the canvas backing store was sized from `offsetWidth`/
 * `offsetHeight` exactly once on mount. If the pad mounted before layout
 * settled (common inside a freshly-opened card on mobile), the canvas was
 * 0×0, every stroke was discarded, and `toDataURL()` produced a blank or
 * invalid PNG — so signatures silently vanished.
 *
 * Fixes:
 *   - Size the backing store with devicePixelRatio scaling for crisp strokes
 *     on retina/mobile screens.
 *   - Re-size via a ResizeObserver so we always have non-zero dimensions
 *     once the element is laid out, and re-fill the white background.
 *   - Paint a solid white background (not transparent) so the saved PNG is
 *     visible in every viewer/email client, including dark mode.
 *   - Track "has drawn" from actual pointer movement, and validate the
 *     exported data URL before calling onSave.
 */
export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  /** Resize the backing store to match the displayed size, with DPR scaling. */
  const resizeCanvas = useCallback((preserve = true) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return // not laid out yet

    const dpr = window.devicePixelRatio || 1
    const targetW = Math.round(rect.width * dpr)
    const targetH = Math.round(rect.height * dpr)

    // Avoid wiping the canvas if dimensions haven't changed.
    if (canvas.width === targetW && canvas.height === targetH) return

    // Snapshot existing content so a resize doesn't erase an in-progress sig.
    let snapshot: ImageData | null = null
    const prevCtx = canvas.getContext("2d")
    if (preserve && prevCtx && canvas.width > 0 && canvas.height > 0) {
      try {
        snapshot = prevCtx.getImageData(0, 0, canvas.width, canvas.height)
      } catch {
        snapshot = null
      }
    }

    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Solid white background — guarantees a visible PNG everywhere.
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (snapshot) {
      try {
        ctx.putImageData(snapshot, 0, 0)
      } catch {
        /* dimensions changed — fine, white bg already painted */
      }
    }

    // Draw in device pixels; we convert client coords to device coords below.
    ctx.strokeStyle = "#0f172a"
    ctx.lineWidth = 2.5 * dpr
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  useEffect(() => {
    // Initial size on next frame so layout has settled.
    const raf = requestAnimationFrame(() => resizeCanvas(false))

    const canvas = canvasRef.current
    let observer: ResizeObserver | null = null
    if (canvas && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => resizeCanvas(true))
      observer.observe(canvas)
    }
    window.addEventListener("orientationchange", () => resizeCanvas(true))

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [resizeCanvas])

  const pointFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY
    if (clientX == null || clientY == null) return null
    return {
      x: (clientX - rect.left) * dpr,
      y: (clientY - rect.top) * dpr,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) e.preventDefault()
    // Make sure we have a valid backing store before the first stroke.
    resizeCanvas(true)

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const pt = pointFromEvent(e)
    if (!pt) return

    drawingRef.current = true
    lastPoint.current = pt
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)
    // Dot for taps.
    ctx.lineTo(pt.x + 0.01, pt.y + 0.01)
    ctx.stroke()
    hasDrawnRef.current = true
    setIsEmpty(false)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return
    if ("touches" in e) e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const pt = pointFromEvent(e)
    if (!pt) return

    ctx.beginPath()
    if (lastPoint.current) ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastPoint.current = pt
  }

  const stopDrawing = () => {
    drawingRef.current = false
    lastPoint.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hasDrawnRef.current = false
    setIsEmpty(true)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawnRef.current) return
    if (canvas.width === 0 || canvas.height === 0) {
      // Backing store never sized — refuse rather than emit a blank PNG.
      console.error("[signature] canvas has zero dimensions, cannot save")
      return
    }

    try {
      const dataUrl = canvas.toDataURL("image/png")
      if (!dataUrl || !dataUrl.startsWith("data:image/png") || dataUrl.length < 1000) {
        console.error("[signature] invalid/empty data URL generated")
        return
      }
      onSave(dataUrl)
    } catch (error) {
      console.error("[signature] error saving signature:", error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        className="w-full h-48 border-2 border-border rounded-lg touch-none bg-white cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2">
        <Button onClick={clear} variant="outline" className="flex-1 bg-transparent">
          Clear
        </Button>
        <Button onClick={onCancel} variant="outline" size="icon">
          <X className="h-4 w-4" />
        </Button>
        <Button onClick={save} disabled={isEmpty} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Save Signature
        </Button>
      </div>
    </div>
  )
}
