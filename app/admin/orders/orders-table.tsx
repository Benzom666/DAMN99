"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { OrderDialog } from "./order-dialog"
import { CSVImportDialog } from "./csv-import-dialog"
import { PrintLabelsDialog } from "@/components/print-labels-dialog"
import { RetryFailedOrderButton, type RetryRouteOption } from "@/components/retry-failed-order-button"
import { archiveOrder, unarchiveOrder, bulkArchiveOrders } from "./actions"
import { useState } from "react"
import Link from "next/link"
import type { Order } from "@/lib/types"
import { Pencil, Archive, ArchiveRestore, Plus, Upload, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrdersTableProps {
  orders: Order[]
  eligibleRoutes?: RetryRouteOption[]
  showArchived?: boolean
}

export function OrdersTable({ orders, eligibleRoutes = [], showArchived = false }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [isArchiving, setIsArchiving] = useState(false)
  const { toast } = useToast()

  function handleCreateOrder() {
    setSelectedOrder(null)
    setIsOrderDialogOpen(true)
  }

  function handleEditOrder(order: Order) {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  async function handleArchiveOrder(orderId: string) {
    if (confirm("Archive this order? It moves off the active manifest but stays on record.")) {
      try {
        await archiveOrder(orderId)
        toast({ title: "Order archived" })
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to archive order.",
          variant: "destructive",
        })
      }
    }
  }

  async function handleUnarchiveOrder(orderId: string) {
    try {
      await unarchiveOrder(orderId)
      toast({ title: "Order restored" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore order.",
        variant: "destructive",
      })
    }
  }

  function toggleOrderSelection(orderId: string) {
    const newSelection = new Set(selectedOrderIds)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrderIds(newSelection)
  }

  function toggleAllOrders() {
    if (selectedOrderIds.size === orders.length) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(orders.map((o) => o.id)))
    }
  }

  function handlePrintLabels() {
    if (selectedOrderIds.size === 0) {
      alert("Please select at least one order to print labels.")
      return
    }
    setIsPrintDialogOpen(true)
  }

  async function handleBulkArchive() {
    if (selectedOrderIds.size === 0) return

    const count = selectedOrderIds.size
    const confirmed = confirm(
      `Archive ${count} order${count > 1 ? "s" : ""}? They move off the active manifest but stay on record.`,
    )

    if (!confirmed) return

    setIsArchiving(true)
    try {
      const result = await bulkArchiveOrders(Array.from(selectedOrderIds))

      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Partial archive",
          description: `Archived ${result.archived} of ${count} orders. Some batches failed.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Orders archived",
          description: `Successfully archived ${result.archived} order${result.archived > 1 ? "s" : ""}.`,
        })
      }
      setSelectedOrderIds(new Set())
    } catch (error) {
      console.error("[v0] Bulk archive error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const selectedOrders = orders.filter((o) => selectedOrderIds.has(o.id))

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "secondary"
      case "assigned":
        return "default"
      case "in_transit":
        return "default"
      case "delivered":
        return "default"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-muted-foreground">
            {showArchived ? "Archived orders — kept on record, off the active manifest" : "Manage delivery orders"}
          </p>
        </div>
        <div className="flex gap-2">
          {!showArchived && selectedOrderIds.size > 0 && (
            <>
              <Button onClick={handleBulkArchive} variant="secondary" disabled={isArchiving}>
                <Archive className="mr-2 h-4 w-4" />
                {isArchiving ? "Archiving..." : `Archive (${selectedOrderIds.size})`}
              </Button>
              <Button onClick={handlePrintLabels} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print Labels ({selectedOrderIds.size})
              </Button>
            </>
          )}
          {!showArchived && (
            <>
              <Button onClick={() => setIsCSVDialogOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={handleCreateOrder}>
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Active / Archived toggle */}
      <div className="inline-flex rounded-md border p-1">
        <Button asChild variant={showArchived ? "ghost" : "secondary"} size="sm">
          <Link href="/admin/orders">Active</Link>
        </Button>
        <Button asChild variant={showArchived ? "secondary" : "ghost"} size="sm">
          <Link href="/admin/orders?view=archived">Archived</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {!showArchived && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedOrderIds.size === orders.length && orders.length > 0}
                    onCheckedChange={toggleAllOrders}
                  />
                </TableHead>
              )}
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showArchived ? 8 : 9} className="text-center text-muted-foreground">
                  {showArchived
                    ? "No archived orders."
                    : "No orders found. Create your first order or import from CSV."}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {!showArchived && (
                    <TableCell>
                      <Checkbox
                        checked={selectedOrderIds.has(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono font-semibold text-primary">
                    {order.order_number || order.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium">{order.customer_name}</TableCell>
                  <TableCell>{order.address}</TableCell>
                  <TableCell>{order.city || "-"}</TableCell>
                  <TableCell>{order.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>{order.route_id ? `Stop ${order.stop_sequence}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {showArchived ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Restore to active manifest"
                          onClick={() => handleUnarchiveOrder(order.id)}
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          {order.status === "failed" && (
                            <RetryFailedOrderButton
                              orderId={order.id}
                              orderLabel={order.order_number || order.id.substring(0, 8).toUpperCase()}
                              availableRoutes={eligibleRoutes}
                              variant="icon"
                            />
                          )}
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEditOrder(order)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Archive"
                            onClick={() => handleArchiveOrder(order.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen} order={selectedOrder} />
      <CSVImportDialog open={isCSVDialogOpen} onOpenChange={setIsCSVDialogOpen} />
      <PrintLabelsDialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} orders={selectedOrders} />
    </div>
  )
}
