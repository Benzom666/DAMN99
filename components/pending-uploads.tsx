"use client"

import { useEffect, useState, useCallback } from "react"
import { CloudUpload, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  count as queueCount,
  peekAll,
  recordAttempt,
  removeByOrderId,
  tryAcquireFlushLock,
  releaseFlushLock,
  type PodDeliveryEntry,
} from "@/lib/pod-uploads/db"

/**
 * PendingUploads — durable POD upload sweeper.
 *
 * Renders a small status pill summarising any queued uploads, and on mount
 * (plus on 'online' events and on a 30s interval) flushes the IndexedDB
 * queue against /api/driver/pod-media/upload. Successful entries are
 * removed; failed entries stay queued for the next sweep.
 *
 * This is what makes the "first few fail" symptom go away — even if the
 * critical-path upload during delivery fails, the data is preserved here
 * and retried until it lands.
 */
export function PendingUploads({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = useState(0)
  const [flushing, setFlushing] = useState(false)
  const [lastResult, setLastResult] = useState<
    | { kind: "ok"; ts: number }
    | { kind: "fail"; ts: number; message: string }
    | null
  >(null)

  const refreshCount = useCallback(async () => {
    try {
      setPending(await queueCount())
    } catch {
      // queue may be unavailable (RSC, old browser) — don't render
    }
  }, [])

  const flush = useCallback(async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return
    if (!navigator.onLine) return
    if (!tryAcquireFlushLock()) return

    setFlushing(true)
    try {
      const entries = await peekAll()
      if (entries.length === 0) {
        setPending(0)
        return
      }

      let succeeded = 0
      let failed = 0
      let lastErr: string | null = null

      for (const entry of entries) {
        try {
          await submitDelivery(entry)
          await removeByOrderId(entry.orderId)
          succeeded++
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          await recordAttempt(entry.orderId, msg)
          failed++
          lastErr = msg
        }
      }

      await refreshCount()

      if (failed === 0 && succeeded > 0) {
        setLastResult({ kind: "ok", ts: Date.now() })
      } else if (failed > 0) {
        setLastResult({
          kind: "fail",
          ts: Date.now(),
          message: lastErr || "Some uploads still pending",
        })
      }
    } finally {
      setFlushing(false)
      releaseFlushLock()
    }
  }, [refreshCount])

  useEffect(() => {
    refreshCount()
    void flush()

    const onOnline = () => void flush()
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void flush()
      }
    }

    window.addEventListener("online", onOnline)
    document.addEventListener("visibilitychange", onVisible)

    const interval = window.setInterval(() => {
      void refreshCount()
      void flush()
    }, 30_000)

    return () => {
      window.removeEventListener("online", onOnline)
      document.removeEventListener("visibilitychange", onVisible)
      window.clearInterval(interval)
    }
  }, [flush, refreshCount])

  if (pending === 0 && !lastResult) return null

  // Compact variant — just an inline badge (used in headers).
  if (compact) {
    if (pending === 0) return null
    return (
      <button
        type="button"
        onClick={() => void flush()}
        disabled={flushing}
        className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft border border-warning/30 px-2.5 py-1 text-[11.5px] font-medium text-warning hover:bg-warning/15 transition-colors disabled:opacity-60"
        title="Pending POD uploads — tap to retry now"
      >
        <CloudUpload className="size-3" strokeWidth={2} />
        {pending} pending
      </button>
    )
  }

  // Full pill — used on the route page list.
  if (pending > 0) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 flex items-center gap-3">
        <div className="size-9 rounded-full bg-warning/20 grid place-items-center flex-shrink-0">
          <CloudUpload className="size-4 text-warning" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-warning">
            {pending} POD {pending === 1 ? "upload" : "uploads"} pending
          </div>
          <div className="text-xs text-foreground/70 mt-0.5">
            Photos + signatures are saved on this device and retrying in the
            background. Stay on a Wi-Fi or cellular connection.
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void flush()}
          disabled={flushing}
          className="flex-shrink-0"
        >
          <RefreshCw className={`size-3.5 ${flushing ? "animate-spin" : ""}`} />
          Retry now
        </Button>
      </div>
    )
  }

  // Recent success toast-style strip
  if (lastResult?.kind === "ok") {
    return (
      <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-2.5 flex items-center gap-3">
        <CheckCircle2 className="size-4 text-success" strokeWidth={2} />
        <div className="text-sm text-success font-medium">
          All POD uploads synced
        </div>
      </div>
    )
  }

  if (lastResult?.kind === "fail") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-2.5 flex items-center gap-3">
        <AlertTriangle className="size-4 text-destructive" strokeWidth={2} />
        <div className="text-sm text-destructive font-medium flex-1">
          Sync issue: {lastResult.message}
        </div>
      </div>
    )
  }

  return null
}

/* -------------------------------------------------- helpers */

async function submitDelivery(entry: PodDeliveryEntry): Promise<void> {
  const fd = new FormData()
  fd.append("orderId", entry.orderId)
  if (entry.notes) fd.append("notes", entry.notes)
  if (entry.recipientName) fd.append("recipientName", entry.recipientName)
  if (entry.photo) fd.append("photo", entry.photo, "photo.jpg")
  if (entry.signature) fd.append("signature", entry.signature, "signature.png")

  // Idempotent endpoint — safe to retry as long as the network allows.
  const res = await fetch("/api/driver/deliver", {
    method: "POST",
    body: fd,
    credentials: "include",
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) detail = body.error
    } catch {
      // body wasn't JSON; keep status code
    }
    throw new Error(detail)
  }

  const body = (await res.json()) as { success?: boolean; error?: string }
  if (!body.success) {
    throw new Error(body.error || "Delivery returned non-success")
  }
}
