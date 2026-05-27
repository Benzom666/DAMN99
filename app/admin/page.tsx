import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Package,
  Route,
  Radio,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
} from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    redirect("/auth/complete-profile")
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect("/driver")
  }

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("status", "pending")

  const { count: deliveredOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("status", "delivered")

  const { count: activeRoutes } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("status", "active")

  const { count: totalDrivers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", user.id)
    .eq("role", "driver")

  const completionRate = totalOrders
    ? Math.round(((deliveredOrders || 0) / totalOrders) * 100)
    : 0

  const operatorName = profile.display_name || "Operator"

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        eyebrow="Operator console"
        title={`Welcome back, ${operatorName}`}
        description="Your day at a glance — routes moving, packages dropping, drivers on shift."
        actions={
          <>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="size-3.5" />
                Import orders
              </Button>
            </Link>
            <Link href="/admin/routes">
              <Button size="sm">
                <Plus className="size-3.5" strokeWidth={2.5} />
                New route
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex-1 px-6 lg:px-10 py-8 space-y-10">
        {/* Section — KPI cards */}
        <section>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Total orders"
              value={totalOrders || 0}
              icon={Package}
              meta={`${pendingOrders || 0} pending`}
              tone="primary"
            />
            <KpiCard
              label="Delivered"
              value={deliveredOrders || 0}
              icon={CheckCircle2}
              meta={`${completionRate}% completion`}
              tone="success"
            />
            <KpiCard
              label="Active routes"
              value={activeRoutes || 0}
              icon={Route}
              meta="On the road"
              tone="info"
            />
            <KpiCard
              label="Drivers"
              value={totalDrivers || 0}
              icon={Users}
              meta="On your team"
              tone="primary"
            />
            <KpiCard
              label="On-time"
              value={`${completionRate || 0}%`}
              icon={TrendingUp}
              meta="This shift"
              tone="warning"
            />
          </div>
        </section>

        {/* Section — Quick navigation */}
        <section>
          <div className="mb-5">
            <div className="section-eyebrow">Operating loop</div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Manage every step of the day
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <NavCard
              icon={Package}
              title="Orders"
              caption="Drop, edit, archive"
              href="/admin/orders"
            />
            <NavCard
              icon={Route}
              title="Routes"
              caption="Optimize and dispatch"
              href="/admin/routes"
              highlight
            />
            <NavCard
              icon={Users}
              title="Drivers"
              caption="Field operators"
              href="/admin/drivers"
            />
            <NavCard
              icon={Radio}
              title="Dispatch"
              caption="Live monitor"
              href="/admin/dispatch"
            />
          </div>
        </section>

        {/* Section — Status */}
        {pendingOrders && pendingOrders > 0 ? (
          <section>
            <div className="soft-card p-5 flex items-start gap-4 border-warning/30 bg-warning-soft">
              <div className="size-10 rounded-full bg-warning/20 grid place-items-center flex-shrink-0">
                <AlertTriangle
                  className="size-5 text-warning"
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant="warning">Action required</Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  You have{" "}
                  <span className="font-semibold text-warning">
                    {pendingOrders}
                  </span>{" "}
                  pending orders waiting to be assigned to a route.
                </p>
                <Link
                  href="/admin/orders"
                  className="text-sm text-warning font-medium hover:underline underline-offset-4 mt-2 inline-flex items-center gap-1"
                >
                  Resolve now
                  <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="soft-card p-5 flex items-center gap-3 border-success/30 bg-success-soft">
              <div className="size-2 rounded-full bg-success" />
              <div className="flex-1">
                <div className="text-sm font-medium text-success">
                  All systems clear
                </div>
                <p className="text-sm text-foreground/80 mt-0.5">
                  No outstanding alerts. Everything's quiet.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/* ---------- KPI tile ---------- */
function KpiCard({
  label,
  value,
  icon: Icon,
  meta,
  tone,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  meta: string
  tone: "primary" | "success" | "warning" | "info"
}) {
  const iconMap = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  }
  return (
    <div className="soft-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`size-9 rounded-full grid place-items-center ${iconMap[tone]}`}>
          <Icon className="size-4" strokeWidth={1.8} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{meta}</div>
    </div>
  )
}

/* ---------- Quick-navigation card ---------- */
function NavCard({
  icon: Icon,
  title,
  caption,
  href,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  caption: string
  href: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`soft-card p-5 group transition-transform hover:-translate-y-0.5 ${
        highlight ? "border-primary/30 bg-primary-soft/40" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-7">
        <div
          className={`size-10 rounded-full grid place-items-center ${
            highlight ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
          }`}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
        <ArrowUpRight
          className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          strokeWidth={1.8}
        />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{caption}</p>
    </Link>
  )
}
