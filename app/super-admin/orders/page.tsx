import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServerClient } from "@/lib/supabase/server"
import { OrdersTable } from "./orders-table"
import { PageHeader } from "@/components/page-header"

export default async function SuperAdminOrdersPage() {
  await requireSuperAdmin()

  const supabase = await createServerClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      admin:profiles!admin_id(email, display_name),
      route:routes(id, name, status)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("Error fetching orders:", error)
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        tag="SUPER · S-04"
        eyebrow="Sovereign · Manifest"
        title="Order"
        serifEmphasis="register"
        description="Latest 500 orders across every tenant."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-6">
        <OrdersTable orders={orders || []} />
      </main>
    </div>
  )
}
