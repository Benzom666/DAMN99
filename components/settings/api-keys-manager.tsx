"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Copy, Check, KeyRound, Plus, Trash2 } from "lucide-react"
import { createApiKey, revokeApiKey, type ApiKeyRow } from "@/app/admin/settings/actions"

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null)
  const [revoking, setRevoking] = useState(false)

  async function handleCreate() {
    setError(null)
    setCreating(true)
    try {
      const { token, key } = await createApiKey(name)
      setKeys((prev) => [key, ...prev])
      setNewToken(token)
      setName("")
      setCreateOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key")
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeApiKey(revokeTarget.id)
      setKeys((prev) =>
        prev.map((k) => (k.id === revokeTarget.id ? { ...k, is_active: false, revoked_at: new Date().toISOString() } : k)),
      )
      setRevokeTarget(null)
      router.refresh()
    } finally {
      setRevoking(false)
    }
  }

  async function copyToken() {
    if (!newToken) return
    try {
      await navigator.clipboard.writeText(newToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — user can select the text manually */
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" strokeWidth={1.8} />
            API keys
          </CardTitle>
          <CardDescription>
            Authenticate the Delivery OS API with these keys. Send them as{" "}
            <code className="text-xs">Authorization: Bearer &lt;key&gt;</code>.
          </CardDescription>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="size-4" strokeWidth={2} />
          Create key
        </Button>
      </CardHeader>

      <CardContent>
        {keys.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No API keys yet. Create one to start using the API.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">
                      {k.key_prefix}…{k.last_four}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(k.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(k.last_used_at)}</TableCell>
                  <TableCell>
                    {k.is_active && !k.revoked_at ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Revoked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {k.is_active && !k.revoked_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeTarget(k)}
                      >
                        <Trash2 className="size-4" strokeWidth={1.8} />
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Give the key a name so you can recognize it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              placeholder="e.g. Production integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? "Creating…" : "Create key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show-once token dialog */}
      <Dialog open={!!newToken} onOpenChange={(open) => !open && setNewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API key</DialogTitle>
            <DialogDescription>
              This is the only time the full key will be shown. Store it somewhere safe.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <code className="flex-1 break-all text-xs">{newToken}</code>
            <Button variant="outline" size="sm" onClick={copyToken}>
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewToken(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Any integration using <span className="font-medium">{revokeTarget?.name}</span> will immediately stop
              working. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRevoke()
              }}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? "Revoking…" : "Revoke key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
