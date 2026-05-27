import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { DriversTable } from "./drivers-table"
import { PageHeader } from "@/components/page-header"

export default async function SuperAdminDriversPage() {
  await requireSuperAdmin()

  const supabase = createServiceRoleClient()

  const { data: drivers, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      admin:profiles!admin_id(email, display_name)
    `,
    )
    .eq("role", "driver")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching drivers:", error)
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        eyebrow="Field"
        title="Driver ledger"
        description="View, suspend, restore, and manage drivers across every tenant."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <DriversTable drivers={drivers || []} />
      </main>
    </div>
  )
}
