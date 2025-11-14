'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, UserPlus, MoreHorizontal } from 'lucide-react'
import { deleteRoute, reassignRoute } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Route = {
  id: string
  name: string | null
  status: string | null
  total_stops: number | null
  completed_stops: number | null
  created_at: string
  driver: { email: string; display_name: string | null } | null
  admin: { email: string; display_name: string | null } | null
}

type Driver = {
  id: string
  email: string
  display_name: string | null
}

export function RoutesTable({ routes, drivers }: { routes: Route[]; drivers: Driver[] }) {
  const router = useRouter()
  const [reassignDialog, setReassignDialog] = useState<{ open: boolean; route: Route | null }>({
    open: false,
    route: null
  })
  const [selectedDriver, setSelectedDriver] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async (route: Route) => {
    if (!confirm(`Delete route ${route.name || route.id}? Orders will be reset to pending.`)) return

    setLoading(true)
    try {
      await deleteRoute(route.id)
      toast.success('Route deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete route')
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignDialog.route) return

    setLoading(true)
    try {
      await reassignRoute(
        reassignDialog.route.id,
        selectedDriver === 'unassigned' ? null : selectedDriver
      )
      toast.success('Driver reassigned')
      setReassignDialog({ open: false, route: null })
      setSelectedDriver('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to reassign driver')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-medium">
                  {route.name || `Route ${route.id.slice(0, 8)}`}
                </TableCell>
                <TableCell>
                  {route.admin ? (route.admin.display_name || route.admin.email) : '-'}
                </TableCell>
                <TableCell>
                  {route.driver ? (
                    <span>{route.driver.display_name || route.driver.email}</span>
                  ) : (
                    <Badge variant="outline">Unassigned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {route.completed_stops || 0} / {route.total_stops || 0}
                </TableCell>
                <TableCell>
                  {route.status === 'active' && <Badge>Active</Badge>}
                  {route.status === 'completed' && <Badge variant="default">Completed</Badge>}
                  {route.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                  {!route.status && <Badge variant="outline">Unknown</Badge>}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(route.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setReassignDialog({ open: true, route })
                        setSelectedDriver(route.driver?.id || 'unassigned')
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Reassign Driver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(route)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Route
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={reassignDialog.open} onOpenChange={(open) => setReassignDialog({ open, route: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Driver</DialogTitle>
            <DialogDescription>
              Change the driver assigned to {reassignDialog.route?.name || 'this route'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
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
            <Button variant="outline" onClick={() => setReassignDialog({ open: false, route: null })}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={loading}>
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
