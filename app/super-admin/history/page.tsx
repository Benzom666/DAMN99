import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { SuperAdminHistoryTable } from "./history-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SuperAdminHistoryPage() {
  await requireSuperAdmin()
  const supabase = createServiceRoleClient()

  const { data: history, error } = await (supabase as any)
    .from("route_history")
    .select("*, admin:profiles!admin_id(display_name, email)")
    .order("archived_at", { ascending: false })
    .limit(300)

  if (error) {
    console.error("[SUPER_ADMIN_HISTORY] Error fetching route_history:", error)
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        eyebrow="Records"
        title="Route & order history"
        description="Every completed and archived route across all tenants — order details and proof of delivery preserved permanently."
      />
      <main className="flex-1 px-6 lg:px-10 py-8">
        <SuperAdminHistoryTable rows={history || []} />
      </main>
    </div>
  )
}
