"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CreateRouteDialog } from "./create-route-dialog"
import { PrintLabelsDialog } from "@/components/print-labels-dialog"
import { deleteRoute, updateRouteStatus, bulkDeleteRoutes, bulkAssignDriver } from "./actions"
import { useState } from "react"
import type { Order, Profile } from "@/lib/types"
import { Plus, Trash2, Play, CheckCircle, Printer, Eye, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Route {
  id: string
  name: string
  driver_id: string | null
  status: string
  total_stops: number
  completed_stops: number
  created_at: string
  driver: { display_name: string | null; email: string } | null
}

interface RoutesTableProps {
  routes: Route[]
  orders: Order[]
  drivers: Profile[]
}

export function RoutesTable({ routes, orders, drivers }: RoutesTableProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [selectedRouteForPrint, setSelectedRouteForPrint] = useState<Route | null>(null)
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null)
  const [activatingRouteId, setActivatingRouteId] = useState<string | null>(null)
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false)
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDeleteRoute(routeId: string) {
    if (confirm("Are you sure you want to delete this route? Orders will be reset to pending.")) {
      setDeletingRouteId(routeId)
      try {
        await deleteRoute(routeId)
        router.refresh()
      } catch (error) {
        console.error("[v0] Error deleting route:", error)
        alert("Failed to delete route. Please try again.")
      } finally {
        setDeletingRouteId(null)
      }
    }
  }

  async function handleActivateRoute(routeId: string) {
    setActivatingRouteId(routeId)
    try {
      await updateRouteStatus(routeId, "active")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error activating route:", error)
      alert("Failed to activate route. Please try again.")
    } finally {
      setActivatingRouteId(null)
    }
  }

  async function handleCompleteRoute(routeId: string) {
    setActivatingRouteId(routeId)
    try {
      await updateRouteStatus(routeId, "completed")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error completing route:", error)
      alert("Failed to complete route. Please try again.")
    } finally {
      setActivatingRouteId(null)
    }
  }

  function handlePrintRouteLabels(route: Route) {
    setSelectedRouteForPrint(route)
    setIsPrintDialogOpen(true)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "draft":
        return "secondary"
      case "active":
        return "default"
      case "completed":
        return "default"
      default:
        return "secondary"
    }
  }

  const routeOrders = selectedRouteForPrint
    ? orders
        .filter((o) => o.route_id === selectedRouteForPrint.id)
        .sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0))
    : []

  function toggleRouteSelection(routeId: string) {
    const newSelection = new Set(selectedRouteIds)
    if (newSelection.has(routeId)) {
      newSelection.delete(routeId)
    } else {
      newSelection.add(routeId)
    }
    setSelectedRouteIds(newSelection)
  }

  function toggleAllRoutes() {
    if (selectedRouteIds.size === routes.length) {
      setSelectedRouteIds(new Set())
    } else {
      setSelectedRouteIds(new Set(routes.map((r) => r.id)))
    }
  }

  async function handleBulkDelete() {
    if (selectedRouteIds.size === 0) return

    const count = selectedRouteIds.size
    const confirmed = confirm(
      `Are you sure you want to delete ${count} route${count > 1 ? "s" : ""}? Orders will be reset to pending. This action cannot be undone.`,
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const result = await bulkDeleteRoutes(Array.from(selectedRouteIds))

      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Partial deletion",
          description: `Deleted ${result.deleted} of ${count} routes. Some deletions failed.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Routes deleted",
          description: `Successfully deleted ${result.deleted} route${result.deleted > 1 ? "s" : ""}.`,
        })
      }
      setSelectedRouteIds(new Set())
      router.refresh()
    } catch (error) {
      console.error("[v0] Bulk delete error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete routes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleBulkAssignDriver() {
    if (selectedRouteIds.size === 0 || !bulkAssignDriverId) return

    setIsAssigning(true)
    try {
      const driverIdToAssign = bulkAssignDriverId === "unassigned" ? null : bulkAssignDriverId
      const result = await bulkAssignDriver(Array.from(selectedRouteIds), driverIdToAssign)

      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Partial assignment",
          description: `Assigned driver to ${result.updated} of ${selectedRouteIds.size} routes. Some assignments failed.`,
          variant: "destructive",
        })
      } else {
        const driverName =
          driverIdToAssign === null
            ? "Unassigned"
            : drivers.find((d) => d.id === driverIdToAssign)?.display_name || "driver"
        toast({
          title: "Driver assigned",
          description: `Successfully assigned ${driverName} to ${result.updated} route${result.updated > 1 ? "s" : ""}.`,
        })
      }
      setSelectedRouteIds(new Set())
      setIsBulkAssignDialogOpen(false)
      setBulkAssignDriverId("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Bulk assign error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign driver. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Routes</h2>
          <p className="text-muted-foreground">Create and manage delivery routes</p>
        </div>
        <div className="flex gap-2">
          {selectedRouteIds.size > 0 && (
            <>
              <Button onClick={handleBulkDelete} variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : `Delete (${selectedRouteIds.size})`}
              </Button>
              <Button onClick={() => setIsBulkAssignDialogOpen(true)} variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Driver ({selectedRouteIds.size})
              </Button>
            </>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRouteIds.size === routes.length && routes.length > 0}
                  onCheckedChange={toggleAllRoutes}
                />
              </TableHead>
              <TableHead>Route Name</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Stops</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No routes found. Create your first route from pending orders.
                </TableCell>
              </TableRow>
            ) : (
              routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRouteIds.has(route.id)}
                      onCheckedChange={() => toggleRouteSelection(route.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell>{route.driver ? route.driver.display_name || route.driver.email : "Unassigned"}</TableCell>
                  <TableCell>{route.total_stops}</TableCell>
                  <TableCell>
                    {route.completed_stops} / {route.total_stops}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(route.status)}>{route.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/routes/${route.id}`}>
                        <Button variant="ghost" size="icon" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrintRouteLabels(route)}
                        title="Print Labels"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {route.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivateRoute(route.id)}
                          disabled={activatingRouteId === route.id}
                          title="Activate Route"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {route.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCompleteRoute(route.id)}
                          disabled={activatingRouteId === route.id}
                          title="Complete Route"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoute(route.id)}
                        disabled={deletingRouteId === route.id}
                        title="Delete Route"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateRouteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        orders={orders}
        drivers={drivers}
      />
      <PrintLabelsDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        orders={routeOrders}
        routeName={selectedRouteForPrint?.name}
      />

      <Dialog open={isBulkAssignDialogOpen} onOpenChange={setIsBulkAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver to Routes</DialogTitle>
            <DialogDescription>
              Select a driver to assign to {selectedRouteIds.size} selected route{selectedRouteIds.size > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Driver</label>
              <Select value={bulkAssignDriverId} onValueChange={setBulkAssignDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAssignDialogOpen(false)} disabled={isAssigning}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignDriver} disabled={!bulkAssignDriverId || isAssigning}>
              {isAssigning ? "Assigning..." : "Assign Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
