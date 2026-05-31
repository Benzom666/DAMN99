"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // `isDrawing` is tracked in a ref (not state) so the move handler always
  // reads the live value — touchmove fires faster than React can re-render,
  // and a stale `false` would silently drop strokes on mobile.
  const isDrawingRef = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  // Size the drawing buffer to the displayed CSS size scaled by the device
  // pixel ratio, then scale the context so 1 drawing unit == 1 CSS pixel.
  // Without this the buffer defaulted to 300x150 while being stretched to fill
  // the element, so touch coordinates (measured in CSS pixels) landed in the
  // wrong place — strokes appeared offset or, on hi-DPI phones, off-canvas
  // entirely, producing what looked like a blank signature.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.strokeStyle = "#000"
    ctx.fillStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  useEffect(() => {
    setupCanvas()
    window.addEventListener("resize", setupCanvas)
    return () => window.removeEventListener("resize", setupCanvas)
  }, [setupCanvas])

  // Map a pointer/touch event to canvas-local CSS pixel coordinates.
  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const source = "touches" in e ? (e.touches[0] ?? e.changedTouches[0]) : e
    if (!source) return null
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent the page from scrolling/zooming while signing. Guard with
    // `cancelable` so passive-listener environments don't throw.
    if ("touches" in e && e.cancelable) {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const point = getPoint(e)
    if (!point) return

    isDrawingRef.current = true
    setIsEmpty(false)

    // Draw a dot so a single tap (signature with no movement) still registers.
    ctx.beginPath()
    ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return

    if ("touches" in e && e.cancelable) {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const point = getPoint(e)
    if (!point) return

    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // clearRect uses the device-pixel buffer dimensions; reset the transform
    // first so the whole buffer is cleared regardless of the DPR scale.
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    setIsEmpty(true)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return

    try {
      const dataUrl = canvas.toDataURL("image/png")
      if (!dataUrl || !dataUrl.startsWith("data:image/png")) {
        console.error("[v0] Invalid canvas data URL generated")
        alert("Failed to save signature. Please try again.")
        return
      }
      console.log("[v0] Signature saved successfully")
      onSave(dataUrl)
    } catch (error) {
      console.error("[v0] Error saving signature:", error)
      alert("Failed to save signature. Please try again.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        className="w-full h-48 border-2 border-border rounded-lg touch-none bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
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
