'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ban, CheckCircle, Trash2, MoreHorizontal } from 'lucide-react'
import { suspendAccount, restoreAccount, deleteProfile } from '../actions'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Driver = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  is_suspended: boolean | null
  admin: { email: string; display_name: string | null } | null
}

export function DriversTable({ drivers }: { drivers: Driver[] }) {
  const router = useRouter()
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; driver: Driver | null }>({
    open: false,
    driver: null
  })
  const [suspendReason, setSuspendReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSuspend = async () => {
    if (!suspendDialog.driver || !suspendReason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    setLoading(true)
    try {
      await suspendAccount(suspendDialog.driver.id, suspendReason)
      toast.success('Driver suspended')
      setSuspendDialog({ open: false, driver: null })
      setSuspendReason('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to suspend driver')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (driver: Driver) => {
    setLoading(true)
    try {
      await restoreAccount(driver.id)
      toast.success('Driver restored')
      router.refresh()
    } catch (error) {
      toast.error('Failed to restore driver')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (driver: Driver) => {
    if (!confirm(`Are you sure you want to delete ${driver.email}? This cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      await deleteProfile(driver.id)
      toast.success('Driver deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete driver')
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
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.email}</TableCell>
                <TableCell>{driver.display_name || '-'}</TableCell>
                <TableCell>
                  {driver.admin ? (driver.admin.display_name || driver.admin.email) : '-'}
                </TableCell>
                <TableCell>
                  {driver.is_suspended ? (
                    <Badge variant="secondary" className="gap-1">
                      <Ban className="h-3 w-3" />
                      Suspended
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(driver.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {driver.is_suspended ? (
                        <DropdownMenuItem onClick={() => handleRestore(driver)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Restore Account
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, driver })}>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend Account
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(driver)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open, driver: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Driver</DialogTitle>
            <DialogDescription>
              Suspend {suspendDialog.driver?.email}? They will not be able to login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for suspension</Label>
              <Input
                id="reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, driver: null })}>
              Cancel
            </Button>
            <Button onClick={handleSuspend} disabled={loading || !suspendReason.trim()}>
              Suspend Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
