"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toggleDriverStatus, deleteDriver } from "./actions"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Driver = {
  id: string
  email: string
  display_name: string | null
  vehicle_capacity: number | null
  shift_start: string | null
  shift_end: string | null
  is_active: boolean | null
  created_at: string
}

export function DriversTable({ drivers }: { drivers: Driver[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)

  async function handleToggle(driverId: string, currentStatus: boolean) {
    console.log("[v0] [CLIENT] Toggle clicked:", { driverId, currentStatus, newStatus: !currentStatus })
    setLoading(driverId)
    const result = await toggleDriverStatus(driverId, !currentStatus)
    setLoading(null)

    if (!result.success) {
      alert(`Failed to update driver status: ${result.error}`)
    } else {
      console.log("[v0] [CLIENT] Toggle successful, refreshing...")
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!driverToDelete) return

    setLoading(driverToDelete.id)
    const result = await deleteDriver(driverToDelete.id)
    setLoading(null)
    setDeleteDialogOpen(false)
    setDriverToDelete(null)

    if (!result.success) {
      alert(`Failed to delete driver: ${result.error}`)
    } else {
      router.refresh()
    }
  }

  const activeDrivers = drivers.filter((d) => d.is_active !== false)
  const inactiveDrivers = drivers.filter((d) => d.is_active === false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drivers</h2>
          <p className="text-muted-foreground">Manage driver availability for route assignment</p>
        </div>
        <div className="flex gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Drivers</CardDescription>
              <CardTitle className="text-3xl">{activeDrivers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inactive Drivers</CardDescription>
              <CardTitle className="text-3xl">{inactiveDrivers.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vehicle Capacity</TableHead>
                <TableHead>Shift Hours</TableHead>
                <TableHead>Available for Routes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => {
                  const isActive = driver.is_active !== false
                  return (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{driver.display_name || "—"}</TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>{driver.vehicle_capacity || "—"}</TableCell>
                      <TableCell>
                        {driver.shift_start && driver.shift_end ? `${driver.shift_start} - ${driver.shift_end}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggle(driver.id, isActive)}
                          disabled={loading === driver.id}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDriverToDelete(driver)
                            setDeleteDialogOpen(true)
                          }}
                          disabled={loading === driver.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {driverToDelete?.display_name || driverToDelete?.email}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
