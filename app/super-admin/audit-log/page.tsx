import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

export default async function AuditLogPage() {
  await requireSuperAdmin()

  const supabase = await createServerClient()

  const { data: logs } = await supabase
    .from("super_admin_audit_log")
    .select(
      `
      *,
      super_admin:profiles!super_admin_id(email, display_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        eyebrow="Compliance"
        title="Audit trail"
        description="Last 100 sovereign actions. Every override, every suspension, every reassignment."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        {!logs || logs.length === 0 ? (
          <div className="soft-card p-10 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Empty trail
            </p>
            <p className="text-sm text-muted-foreground">
              No sovereign actions recorded yet.
            </p>
          </div>
        ) : (
          <div className="soft-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary">
                <tr className="text-left">
                  <Th>Time</Th>
                  <Th>Sovereign</Th>
                  <Th>Action</Th>
                  <Th>Target</Th>
                  <Th>Details</Th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.super_admin?.display_name ||
                        log.super_admin?.email ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-primary whitespace-nowrap">
                      {log.target_table}:{log.target_id?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground tracking-tight">
      {children}
    </th>
  )
}
