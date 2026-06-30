"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createOrder, updateOrder, updateOrderStatus } from "./actions"
import { useEffect, useState } from "react"
import type { Order } from "@/lib/types"

// Admin may set any status except "delivered" — that only comes from a driver POD.
type AdminEditableStatus = "pending" | "assigned" | "in_transit" | "failed"
const ADMIN_STATUS_OPTIONS: { value: AdminEditableStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_transit", label: "In transit" },
  { value: "failed", label: "Failed" },
]

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: Order | null
}

export function OrderDialog({ open, onOpenChange, order }: OrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  // Status is only editable on existing orders, and only when the current
  // status is one the admin is allowed to set (i.e. not "delivered").
  const canEditStatus = !!order && order.status !== "delivered"
  const [status, setStatus] = useState<AdminEditableStatus>(
    (order?.status as AdminEditableStatus) ?? "pending",
  )

  // Keep the status select in sync when the dialog is reused for another order.
  useEffect(() => {
    if (order && order.status !== "delivered") {
      setStatus(order.status as AdminEditableStatus)
    }
  }, [order])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      if (order) {
        await updateOrder(order.id, formData)
        if (canEditStatus && status !== order.status) {
          await updateOrderStatus(order.id, status)
        }
      } else {
        await createOrder(formData)
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving order:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Order" : "Create Order"}</DialogTitle>
          <DialogDescription>
            {order ? "Update the order details below." : "Add a new delivery order to the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input id="customer_name" name="customer_name" defaultValue={order?.customer_name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_email">
                Customer Email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                defaultValue={order?.customer_email}
                placeholder="customer@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">Required for POD email notifications</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" name="address" defaultValue={order?.address} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={order?.city || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={order?.state || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" name="zip" defaultValue={order?.zip || ""} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={order?.phone || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={order?.notes || ""} rows={3} />
            </div>
            {order &&
              (canEditStatus ? (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as AdminEditableStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Delivered is set automatically when a driver captures proof of delivery.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Delivered — locked (set by driver proof of delivery).
                  </p>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : order ? "Update Order" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
