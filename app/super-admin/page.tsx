import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { getHereCostAnalytics, getSystemStats } from "./actions"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Truck,
  Package,
  Ban,
  Activity,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  Database,
  FileText,
} from "lucide-react"
import Link from "next/link"

export default async function SuperAdminDashboard() {
  await requireSuperAdmin()

  const [stats, hereCosts] = await Promise.all([
    getSystemStats(),
    getHereCostAnalytics(),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        eyebrow="Sovereign console"
        title="God mode"
        description="Cross-tenant control. Every admin, every driver, every order, every cent."
      />

      <div className="flex-1 px-6 lg:px-10 py-8 space-y-10">
        {/* Sovereign zone banner */}
        <section>
          <div className="soft-card p-5 flex items-start gap-4 border-destructive/30 bg-destructive-soft">
            <div className="size-10 rounded-full bg-destructive/15 grid place-items-center flex-shrink-0">
              <ShieldAlert
                className="size-5 text-destructive"
                strokeWidth={1.8}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="destructive">Sovereign zone</Badge>
                <span className="text-xs text-destructive">
                  Every action audited
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                You are operating with elevated privileges. Suspensions,
                deletions, and reassignments propagate immediately.
              </p>
            </div>
            <Link
              href="/super-admin/audit-log"
              className="text-sm text-destructive hover:underline underline-offset-4 font-medium inline-flex items-center gap-1 whitespace-nowrap"
            >
              View audit log
              <ArrowUpRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* System ledger */}
        <section>
          <div className="mb-5">
            <div className="section-eyebrow">System ledger</div>
            <h2 className="text-xl font-bold tracking-tight">
              Cross-tenant inventory
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SuperKpi
              icon={Building2}
              value={stats.totalAdmins}
              label="Admins"
              meta="Tenant operators"
              tone="primary"
            />
            <SuperKpi
              icon={Truck}
              value={stats.totalDrivers}
              label="Drivers"
              meta="Field operators"
              tone="info"
            />
            <SuperKpi
              icon={Activity}
              value={stats.totalRoutes}
              label="Routes"
              meta={`${stats.activeRoutes} active`}
              tone="warning"
            />
            <SuperKpi
              icon={Package}
              value={stats.totalOrders}
              label="Orders"
              meta={`${stats.completedOrders} completed`}
              tone="success"
            />
            <SuperKpi
              icon={Ban}
              value={stats.suspendedAccounts}
              label="Suspended"
              meta="Locked accounts"
              tone="destructive"
            />
            <SuperKpi
              icon={DollarSign}
              value={`$${(hereCosts.last24h.costCents / 100).toFixed(2)}`}
              label="HERE 24h"
              meta={`${hereCosts.last24h.requests} paid req`}
              tone="success"
            />
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-5">
            <div className="section-eyebrow">Sovereign actions</div>
            <h2 className="text-xl font-bold tracking-tight">
              Cross-tenant control surfaces
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SuperNavCard
              icon={Building2}
              title="Admins"
              caption="Suspend, restore, delete"
              href="/super-admin/admins"
              danger
            />
            <SuperNavCard
              icon={DollarSign}
              title="Costs"
              caption="API spend by tenant"
              href="/super-admin/costs"
            />
            <SuperNavCard
              icon={FileText}
              title="Audit log"
              caption="Every sovereign action"
              href="/super-admin/audit-log"
            />
            <SuperNavCard
              icon={Database}
              title="System health"
              caption="Database, performance"
              href="/super-admin/system"
            />
          </div>
        </section>

        {/* HERE cost summary */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="section-eyebrow">HERE API spend</div>
              <h2 className="text-xl font-bold tracking-tight">
                Money on the wire
              </h2>
            </div>
            <Link
              href="/super-admin/costs"
              className="text-sm text-primary hover:underline underline-offset-4 font-medium inline-flex items-center gap-1"
            >
              Full breakdown
              <ArrowUpRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 soft-card overflow-hidden p-0">
            {[
              {
                l: "Last 24h",
                v: `$${(hereCosts.last24h.costCents / 100).toFixed(2)}`,
                m: `${hereCosts.last24h.requests} req · ${hereCosts.last24h.cacheHits} cached`,
              },
              {
                l: "Last 7 days",
                v: `$${(hereCosts.last7d.costCents / 100).toFixed(2)}`,
                m: `${hereCosts.last7d.requests} req · ${hereCosts.last7d.errors} errors`,
              },
              {
                l: "Last 30 days",
                v: `$${(hereCosts.last30d.costCents / 100).toFixed(2)}`,
                m: `${hereCosts.last30d.requests} req · ${hereCosts.last30d.cacheHits} cached`,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="px-5 py-5 border-r border-border last:border-r-0 border-b sm:border-b-0"
              >
                <div className="text-sm text-muted-foreground">{s.l}</div>
                <div className="text-2xl font-bold tracking-tight mt-1.5 text-success">
                  {s.v}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.m}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ------- super metric ------- */
function SuperKpi({
  icon: Icon,
  value,
  label,
  meta,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: string | number
  label: string
  meta: string
  tone: "primary" | "success" | "info" | "warning" | "destructive"
}) {
  const iconMap = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    destructive: "bg-destructive-soft text-destructive",
  }
  const valueMap = {
    primary: "text-foreground",
    success: "text-foreground",
    info: "text-foreground",
    warning: "text-foreground",
    destructive: "text-destructive",
  }

  const cardClass =
    tone === "destructive" ? "soft-card p-5 bg-destructive-soft/40 animate-rise" : "soft-card p-5 animate-rise"

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div
          className={`size-9 rounded-full grid place-items-center ${iconMap[tone]}`}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </div>
      </div>
      <div
        className={`text-3xl font-bold tracking-tight ${valueMap[tone]}`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{meta}</div>
    </div>
  )
}

function SuperNavCard({
  icon: Icon,
  title,
  caption,
  href,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  caption: string
  href: string
  danger?: boolean
}) {
  return (
    <Link
      href={href}
      className={`soft-card p-5 group transition-transform hover:-translate-y-0.5 animate-rise ${
        danger ? "border-destructive/30 bg-destructive-soft/40" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-7">
        <div
          className={`size-10 rounded-full grid place-items-center ${
            danger
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary-soft text-primary"
          }`}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
        <ArrowUpRight
          className={`size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ${
            danger
              ? "text-destructive/70 group-hover:text-destructive"
              : "text-muted-foreground group-hover:text-primary"
          }`}
          strokeWidth={1.8}
        />
      </div>

      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{caption}</p>
    </Link>
  )
}
