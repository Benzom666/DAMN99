"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { retryFailedOrder, addFailedOrderToRoute } from "@/app/admin/orders/actions"

export interface RetryRouteOption {
  id: string
  name: string
  status: string
}

interface RetryFailedOrderButtonProps {
  orderId: string
  orderLabel: string
  /**
   * Routes the user can re-add the failed order to. Should already be filtered
   * to non-archived, non-completed routes belonging to this admin.
   */
  availableRoutes?: RetryRouteOption[]
  /** Visual style — icon-only or full button */
  variant?: "icon" | "default"
  className?: string
}

/**
 * Renders a button that opens a small dialog letting the admin either:
 *   - Send the failed order back to the pending pool (no route)
 *   - Append the failed order to an existing draft/active route
 *
 * Both choices increment retry_count and write a stop_events 'rerouted' row.
 */
export function RetryFailedOrderButton({
  orderId,
  orderLabel,
  availableRoutes = [],
  variant = "icon",
  className,
}: RetryFailedOrderButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"pending" | "route">("pending")
  const [targetRouteId, setTargetRouteId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      if (mode === "pending") {
        await retryFailedOrder(orderId)
        toast({
          title: "Order re-queued",
          description: `${orderLabel} is back in the pending pool.`,
        })
      } else {
        if (!targetRouteId) {
          toast({
            title: "Pick a route",
            description: "Select a target route, or choose 'Pending pool' instead.",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }
        const r = await addFailedOrderToRoute(orderId, targetRouteId)
        toast({
          title: "Order added to route",
          description: `${orderLabel} placed as stop #${r.stop_sequence}.`,
        })
      }
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast({
        title: "Retry failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          title="Retry / re-route this failed order"
          className={className}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className={className}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry / Re-route
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry failed delivery</DialogTitle>
            <DialogDescription>
              Re-queue <span className="font-mono">{orderLabel}</span> for another delivery attempt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Where should this order go?</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "pending" | "route")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    Send back to Pending pool (no route)
                  </SelectItem>
                  <SelectItem
                    value="route"
                    disabled={availableRoutes.length === 0}
                  >
                    Add to an existing route
                  </SelectItem>
                </SelectContent>
              </Select>
              {availableRoutes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No active or draft routes available. Create one first to use this option.
                </p>
              )}
            </div>

            {mode === "route" && (
              <div className="space-y-2">
                <Label>Target route</Label>
                <Select value={targetRouteId} onValueChange={setTargetRouteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoutes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({r.status})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The order will be appended at the end of the route. Re-optimize afterwards if you need a different sequence.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Working…"
                : mode === "pending"
                  ? "Send to pending"
                  : "Add to route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
