import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createServerClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function AuditLogPage() {
  await requireSuperAdmin()
  
  const supabase = await createServerClient()

  const { data: logs } = await supabase
    .from('super_admin_audit_log')
    .select(`
      *,
      super_admin:profiles!super_admin_id(email, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
        <p className="text-muted-foreground">
          View all super admin actions (latest 100)
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  {log.super_admin?.display_name || log.super_admin?.email || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.target_table}:{log.target_id?.slice(0, 8)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {JSON.stringify(log.details)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
