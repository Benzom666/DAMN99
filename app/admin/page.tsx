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
  Clock,
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

  // Stats queries (preserved from original)
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
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        tag="OPS-CONSOLE"
        eyebrow="Sector A · Dispatch"
        title="Operator console,"
        serifEmphasis={operatorName}
        description="The day at a glance. Routes moving, packages dropping, drivers running their manifests."
        live
        actions={
          <>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="size-3.5" />
                Import orders
              </Button>
            </Link>
            <Link href="/admin/routes">
              <Button variant="signal" size="sm">
                <Plus className="size-3.5" strokeWidth={2.5} />
                New route
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex-1 px-6 lg:px-10 py-8 space-y-10">
        {/* Section 1 — Live Metrics */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="eyebrow-signal">§ 01 · Live ledger</span>
              <h2 className="text-xl font-semibold tracking-tight mt-1">
                What's moving right now
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              auto-refresh · 30s
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              code="M-01"
              label="Total orders"
              value={totalOrders || 0}
              meta={`${pendingOrders || 0} pending`}
              icon={Package}
              accent="default"
            />
            <MetricCard
              code="M-02"
              label="Delivered"
              value={deliveredOrders || 0}
              meta={`${completionRate}% completion`}
              icon={CheckCircle2}
              accent="success"
            />
            <MetricCard
              code="M-03"
              label="Active routes"
              value={activeRoutes || 0}
              meta="On the road"
              icon={Route}
              accent="info"
            />
            <MetricCard
              code="M-04"
              label="Driver fleet"
              value={totalDrivers || 0}
              meta="Operators online"
              icon={Users}
              accent="signal"
            />
            <MetricCard
              code="M-05"
              label="On-time"
              value={`${completionRate || 0}%`}
              meta="This shift"
              icon={TrendingUp}
              accent="warning"
            />
          </div>
        </section>

        {/* Section 2 — Operating loop */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="eyebrow-signal">§ 02 · Operating loop</span>
              <h2 className="text-xl font-semibold tracking-tight mt-1">
                Four moves to ship the day
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <OpsCard
              code="OPS-01"
              icon={Package}
              title="Orders"
              caption="Drop, edit, archive"
              href="/admin/orders"
            />
            <OpsCard
              code="OPS-02"
              icon={Route}
              title="Routes"
              caption="Optimize and dispatch"
              href="/admin/routes"
              primary
            />
            <OpsCard
              code="OPS-03"
              icon={Users}
              title="Drivers"
              caption="Field operators"
              href="/admin/drivers"
            />
            <OpsCard
              code="OPS-04"
              icon={Radio}
              title="Dispatch"
              caption="Live monitor"
              href="/admin/dispatch"
            />
          </div>
        </section>

        {/* Section 3 — Attention */}
        {pendingOrders && pendingOrders > 0 ? (
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="eyebrow-signal">§ 03 · Attention</span>
                <h2 className="text-xl font-semibold tracking-tight mt-1">
                  Open items on your manifest
                </h2>
              </div>
            </div>

            <div className="border border-warning/40 bg-warning-soft px-5 py-5 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-warning" />
              <div className="flex items-start gap-4">
                <div className="size-10 grid place-items-center bg-warning/15 border border-warning/40 rounded-sm flex-shrink-0">
                  <AlertTriangle className="size-5 text-warning" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Badge variant="warning">REQUIRES ACTION</Badge>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-warning">
                      {pendingOrders} unassigned
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    You have{" "}
                    <span className="font-mono font-semibold text-warning">
                      {pendingOrders}
                    </span>{" "}
                    pending orders waiting to be assigned to a route.
                  </p>
                  <Link
                    href="/admin/orders"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-warning hover:underline underline-offset-4 mt-3 inline-flex items-center gap-1"
                  >
                    Resolve now
                    <ArrowUpRight className="size-3" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="border border-success/40 bg-success-soft px-5 py-4 rounded-sm relative">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-success" />
              <div className="flex items-center gap-3">
                <div className="pulse-dot" />
                <div className="flex-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-success">
                    All systems clear
                  </span>
                  <p className="text-sm text-foreground/80 mt-0.5">
                    No outstanding alerts. The yard is quiet.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/* ---------- Metric tile ---------- */
function MetricCard({
  code,
  label,
  value,
  meta,
  icon: Icon,
  accent,
}: {
  code: string
  label: string
  value: string | number
  meta: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  accent: "default" | "signal" | "success" | "warning" | "info" | "destructive"
}) {
  const accentClass = {
    default: "text-foreground",
    signal: "text-signal",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
    destructive: "text-destructive",
  }[accent]

  return (
    <div className="metric-card group">
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
          {code}
        </span>
        <Icon
          className={`size-4 ${accentClass} opacity-70 group-hover:opacity-100 transition-opacity`}
          strokeWidth={1.6}
        />
      </div>
      <div className={`font-mono text-3xl font-semibold tracking-tight ${accentClass} mb-1`}>
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-xs text-muted-foreground/80 mt-2 pt-2 border-t border-border flex items-center gap-1.5">
        <Clock className="size-3" />
        {meta}
      </div>
    </div>
  )
}

/* ---------- Ops nav card ---------- */
function OpsCard({
  code,
  icon: Icon,
  title,
  caption,
  href,
  primary = false,
}: {
  code: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  caption: string
  href: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group relative border bg-card hover:bg-surface-2 transition-all duration-200 p-5 overflow-hidden ${
        primary ? "border-signal/50 bg-signal-soft" : "border-border hover:border-border-strong"
      }`}
    >
      <div className="flex items-center justify-between mb-7">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
          {code}
        </span>
        <ArrowUpRight
          className="size-4 text-muted-foreground group-hover:text-signal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          strokeWidth={1.6}
        />
      </div>

      <Icon
        className={`size-7 mb-4 ${primary ? "text-signal" : "text-foreground"} group-hover:text-signal transition-colors`}
        strokeWidth={1.4}
      />

      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>

      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-signal group-hover:w-full transition-all duration-500" />
    </Link>
  )
}
