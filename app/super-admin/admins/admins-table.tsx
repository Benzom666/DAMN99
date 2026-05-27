'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ban, CheckCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { suspendAccount, restoreAccount, deleteProfile, updateAdminApiKey } from '../actions'
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

type Admin = {
  id: string
  email: string
  display_name: string | null
  here_api_key: string | null
  created_at: string
  is_suspended: boolean | null
  suspended_at: string | null
  suspension_reason: string | null
  role: string
}

export function AdminsTable({ admins }: { admins: Admin[] }) {
  const router = useRouter()
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; admin: Admin | null }>({
    open: false,
    admin: null
  })
  const [apiKeyDialog, setApiKeyDialog] = useState<{ open: boolean; admin: Admin | null }>({
    open: false,
    admin: null
  })
  const [suspendReason, setSuspendReason] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSuspend = async () => {
    if (!suspendDialog.admin || !suspendReason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    setLoading(true)
    try {
      await suspendAccount(suspendDialog.admin.id, suspendReason)
      toast.success('Account suspended')
      setSuspendDialog({ open: false, admin: null })
      setSuspendReason('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to suspend account')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (admin: Admin) => {
    setLoading(true)
    try {
      await restoreAccount(admin.id)
      toast.success('Account restored')
      router.refresh()
    } catch (error) {
      toast.error('Failed to restore account')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`Are you sure you want to delete ${admin.email}? This cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      await deleteProfile(admin.id)
      toast.success('Account deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateApiKey = async () => {
    if (!apiKeyDialog.admin) return

    setLoading(true)
    try {
      await updateAdminApiKey(apiKeyDialog.admin.id, apiKey || null)
      toast.success(apiKey ? 'API key updated' : 'API key removed - using platform key')
      setApiKeyDialog({ open: false, admin: null })
      setApiKey('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update API key')
    } finally {
      setLoading(false)
    }
  }

  const openApiKeyDialog = (admin: Admin) => {
    setApiKey(admin.here_api_key || '')
    setApiKeyDialog({ open: true, admin })
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>HERE API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.email}</TableCell>
                <TableCell>{admin.display_name || '-'}</TableCell>
                <TableCell>
                  {admin.here_api_key ? (
                    <Badge variant="outline" className="gap-1 font-mono text-xs">
                      {admin.here_api_key.slice(0, 12)}...
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Platform key</span>
                  )}
                </TableCell>
                <TableCell>
                  {admin.role === 'super_admin' ? (
                    <Badge variant="destructive">Super Admin</Badge>
                  ) : admin.is_suspended ? (
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
                  {new Date(admin.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {admin.role !== 'super_admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {typeof admin.here_api_key !== 'undefined' && (
                          <DropdownMenuItem onClick={() => openApiKeyDialog(admin)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit API Key
                          </DropdownMenuItem>
                        )}
                        {admin.is_suspended ? (
                          <DropdownMenuItem onClick={() => handleRestore(admin)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Restore Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, admin })}>
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend Account
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(admin)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open, admin: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Suspend {suspendDialog.admin?.email}? They will not be able to login.
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
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, admin: null })}>
              Cancel
            </Button>
            <Button onClick={handleSuspend} disabled={loading || !suspendReason.trim()}>
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

      <Dialog open={apiKeyDialog.open} onOpenChange={(open) => setApiKeyDialog({ open, admin: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit HERE API Key</DialogTitle>
            <DialogDescription>
              Set a custom HERE API key for {apiKeyDialog.admin?.email}. Leave blank to use the platform key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">HERE API Key (Optional)</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter HERE API key or leave blank..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {apiKey ? 'This admin will use their own key for all HERE API calls' : 'This admin will use the platform key (shared)'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialog({ open: false, admin: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateApiKey} disabled={loading}>
              {apiKey ? 'Set Custom Key' : 'Use Platform Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
