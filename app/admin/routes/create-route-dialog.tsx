"use client"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRoute, createMultipleRoutes } from "./actions"
import { useState } from "react"
import type { Order, Profile } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface CreateRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: Order[]
  drivers: Profile[]
}

export function CreateRouteDialog({ open, onOpenChange, orders, drivers }: CreateRouteDialogProps) {
  const [name, setName] = useState("")
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [driverId, setDriverId] = useState<string | null>(null)
  const [multiRouteMode, setMultiRouteMode] = useState(false)
  const [numberOfRoutes, setNumberOfRoutes] = useState("2")
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [assignDriversLater, setAssignDriversLater] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // --- Optimization constraints (admin-controlled) ---
  const [optimizeOrder, setOptimizeOrder] = useState(true)
  const [returnToDepot, setReturnToDepot] = useState(true)
  const [capacity, setCapacity] = useState("")
  const [shiftStart, setShiftStart] = useState("")
  const [shiftEnd, setShiftEnd] = useState("")

  const router = useRouter()

  function buildOptions() {
    return {
      use2Opt: optimizeOrder,
      returnToDepot,
      capacity: capacity ? Number(capacity) : undefined,
      shiftStart: shiftStart || undefined,
      shiftEnd: shiftEnd || undefined,
    }
  }

  const availableOrders = orders.filter((o) => {
    const validStatus = !o.status || o.status === "pending"
    const hasCoords = o.latitude && o.longitude
    return validStatus && hasCoords
  })

  function toggleOrder(orderId: string) {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  function toggleDriver(driverId: string) {
    const newSelected = new Set(selectedDrivers)
    if (newSelected.has(driverId)) {
      newSelected.delete(driverId)
    } else {
      newSelected.add(driverId)
    }
    setSelectedDrivers(newSelected)
  }

  function toggleAllOrders() {
    if (selectedOrders.size === availableOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(availableOrders.map((o) => o.id)))
    }
  }

  async function handleCreate() {
    if (selectedOrders.size === 0) return

    setIsLoading(true)
    try {
      const options = buildOptions()
      if (multiRouteMode) {
        const routeCount = Number.parseInt(numberOfRoutes) || 2
        const driversToUse = assignDriversLater ? [] : Array.from(selectedDrivers)
        await createMultipleRoutes(Array.from(selectedOrders), driversToUse, routeCount, options)
      } else {
        if (!name) {
          alert("Please enter a route name")
          setIsLoading(false)
          return
        }
        await createRoute(name, Array.from(selectedOrders), driverId, options)
      }

      // Reset form
      setName("")
      setSelectedOrders(new Set())
      setDriverId(null)
      setSelectedDrivers(new Set())
      setMultiRouteMode(false)
      setNumberOfRoutes("2")
      setAssignDriversLater(true)
      setCapacity("")
      setShiftStart("")
      setShiftEnd("")
      setOptimizeOrder(true)
      setReturnToDepot(true)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating route:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Route</DialogTitle>
          <DialogDescription>
            {multiRouteMode
              ? "Create multiple routes and distribute orders automatically"
              : "Select orders and assign a driver"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multi-route"
              checked={multiRouteMode}
              onCheckedChange={(checked) => {
                setMultiRouteMode(checked === true)
                if (checked) {
                  setDriverId(null)
                  setName("")
                } else {
                  setSelectedDrivers(new Set())
                  setAssignDriversLater(true)
                }
              }}
            />
            <Label htmlFor="multi-route" className="text-sm font-normal">
              Create multiple routes
            </Label>
          </div>

          {!multiRouteMode && (
            <div className="grid gap-2">
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                placeholder="Morning Route - Downtown"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {multiRouteMode ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="num-routes">Number of Routes</Label>
                <Input
                  id="num-routes"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g., 3"
                  value={numberOfRoutes}
                  onChange={(e) => setNumberOfRoutes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Orders will be distributed evenly across routes
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assign-later"
                  checked={assignDriversLater}
                  onCheckedChange={(checked) => {
                    setAssignDriversLater(checked === true)
                    if (checked) {
                      setSelectedDrivers(new Set())
                    }
                  }}
                />
                <Label htmlFor="assign-later" className="text-sm font-normal">
                  Assign drivers later
                </Label>
              </div>

              {!assignDriversLater && (
                <div className="space-y-2">
                  <Label>Select Drivers ({selectedDrivers.size} selected)</Label>
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {drivers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No drivers available</div>
                    ) : (
                      <div className="divide-y">
                        {drivers.map((driver) => (
                          <div key={driver.id} className="flex items-center space-x-3 p-3 hover:bg-accent">
                            <Checkbox
                              checked={selectedDrivers.has(driver.id)}
                              onCheckedChange={() => toggleDriver(driver.id)}
                            />
                            <div className="flex-1 text-sm">
                              <div className="font-medium">{driver.display_name || driver.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {assignDriversLater && (
                <Badge variant="secondary" className="mt-2">
                  {numberOfRoutes} routes will be created without drivers
                </Badge>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="driver">Assign Driver (Optional)</Label>
              <Select
                value={driverId || "unassigned"}
                onValueChange={(val) => setDriverId(val === "unassigned" ? null : val)}
              >
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Select driver..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.display_name || driver.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator className="my-4" />

          {/* Optimization constraints */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Optimization constraints</Label>
              <span className="text-xs text-muted-foreground">applied when building routes</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="shift-start" className="text-xs font-normal text-muted-foreground">
                  Shift start
                </Label>
                <Input id="shift-start" type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="shift-end" className="text-xs font-normal text-muted-foreground">
                  Shift end
                </Label>
                <Input id="shift-end" type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="capacity" className="text-xs font-normal text-muted-foreground">
                Vehicle capacity (max stops per route, optional)
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="e.g., 50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="return-depot"
                  checked={returnToDepot}
                  onCheckedChange={(c) => setReturnToDepot(c === true)}
                />
                <Label htmlFor="return-depot" className="text-sm font-normal">
                  Return to depot
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optimize-order"
                  checked={optimizeOrder}
                  onCheckedChange={(c) => setOptimizeOrder(c === true)}
                />
                <Label htmlFor="optimize-order" className="text-sm font-normal">
                  Optimize stop order
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Shift window and capacity are enforced by the optimization engine. Leave blank to use each driver&apos;s
              defaults.
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Orders ({selectedOrders.size} selected)</Label>
              {availableOrders.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-orders"
                    checked={selectedOrders.size === availableOrders.length && availableOrders.length > 0}
                    onCheckedChange={toggleAllOrders}
                  />
                  <Label htmlFor="select-all-orders" className="text-sm font-normal cursor-pointer">
                    Select All
                  </Label>
                </div>
              )}
            </div>
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {availableOrders.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No pending orders with valid coordinates available
                </div>
              ) : (
                <div className="divide-y">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="flex items-center space-x-3 p-3 hover:bg-accent">
                      <Checkbox checked={selectedOrders.has(order.id)} onCheckedChange={() => toggleOrder(order.id)} />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-muted-foreground">
                          {order.address}
                          {order.city && `, ${order.city}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isLoading ||
              selectedOrders.size === 0 ||
              (!multiRouteMode && !name) ||
              (multiRouteMode && !numberOfRoutes)
            }
          >
            {isLoading ? "Creating..." : multiRouteMode ? "Create Routes" : "Create Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
