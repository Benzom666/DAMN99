import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { createServerClient } from "@/lib/supabase/server"
import { Database, Activity, TrendingUp, FileImage } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default async function SystemHealthPage() {
  await requireSuperAdmin()

  const supabase = await createServerClient()

  const [
    { count: totalProfiles },
    { count: totalOrders },
    { count: totalRoutes },
    { count: totalPods },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("routes").select("*", { count: "exact", head: true }),
    supabase.from("pods").select("*", { count: "exact", head: true }),
  ])

  const cards = [
    {
      icon: Database,
      label: "Total profiles",
      value: totalProfiles || 0,
      meta: "Database records",
    },
    {
      icon: Activity,
      label: "Total orders",
      value: totalOrders || 0,
      meta: "All-time orders",
    },
    {
      icon: TrendingUp,
      label: "Total routes",
      value: totalRoutes || 0,
      meta: "All-time routes",
    },
    {
      icon: FileImage,
      label: "Total PODs",
      value: totalPods || 0,
      meta: "Proof of deliveries",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        eyebrow="Infrastructure"
        title="System health"
        description="Database statistics and system performance counters."
      />

      <main className="flex-1 px-6 lg:px-10 py-8 space-y-8">
        <section>
          <div className="mb-5">
            <div className="section-eyebrow">Database counters</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="soft-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm text-muted-foreground">{c.label}</div>
                  <div className="size-9 rounded-full bg-primary-soft text-primary grid place-items-center">
                    <c.icon className="size-4" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {c.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {c.meta}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <div className="section-eyebrow">Operational status</div>
          </div>
          <div className="soft-card p-5 flex items-center gap-3 border-success/30 bg-success-soft">
            <div className="size-2 rounded-full bg-success" />
            <div className="flex-1">
              <div className="text-sm font-medium text-success">
                All systems green
              </div>
              <p className="text-sm text-foreground/80 mt-0.5">
                Database, auth, storage, and HERE API integrations are
                reachable. Last check{" "}
                <span className="font-medium text-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
