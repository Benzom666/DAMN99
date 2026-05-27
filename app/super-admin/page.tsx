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
    <div className="flex flex-col min-h-screen relative">
      <PageHeader
        tag="SUPER · OPS-00"
        eyebrow="Sovereign console"
        title="God"
        serifEmphasis="mode"
        description="Cross-tenant control. Every admin, every driver, every order, every cent."
        live
      />

      <div className="flex-1 px-6 lg:px-10 py-8 space-y-10">
        {/* DANGER STRIP */}
        <section>
          <div className="border border-destructive/40 bg-destructive-soft px-5 py-3.5 rounded-sm relative overflow-hidden flex items-center gap-4">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-destructive" />
            <ShieldAlert
              className="size-5 text-destructive flex-shrink-0"
              strokeWidth={1.6}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <Badge variant="destructive">SOVEREIGN ZONE</Badge>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive">
                  Every action audited
                </span>
              </div>
              <p className="text-sm text-foreground/90 mt-1">
                You are operating with elevated privileges. Suspensions,
                deletions, and reassignments propagate immediately.
              </p>
            </div>
            <Link href="/super-admin/audit-log">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-destructive hover:underline underline-offset-4 inline-flex items-center gap-1 whitespace-nowrap">
                View audit log
                <ArrowUpRight className="size-3" strokeWidth={2.5} />
              </span>
            </Link>
          </div>
        </section>

        {/* Section 1 — System ledger */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="eyebrow-signal">§ 01 · System ledger</span>
              <h2 className="text-xl font-semibold tracking-tight mt-1">
                Cross-tenant inventory
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              all tenants · live
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <SuperMetric
              code="S-01"
              icon={Building2}
              value={stats.totalAdmins}
              label="Admins"
              meta="Tenant operators"
              accent="signal"
            />
            <SuperMetric
              code="S-02"
              icon={Truck}
              value={stats.totalDrivers}
              label="Drivers"
              meta="Field operators"
              accent="info"
            />
            <SuperMetric
              code="S-03"
              icon={Activity}
              value={stats.totalRoutes}
              label="Routes"
              meta={`${stats.activeRoutes} active`}
              accent="warning"
            />
            <SuperMetric
              code="S-04"
              icon={Package}
              value={stats.totalOrders}
              label="Orders"
              meta={`${stats.completedOrders} completed`}
              accent="success"
            />
            <SuperMetric
              code="S-05"
              icon={Ban}
              value={stats.suspendedAccounts}
              label="Suspended"
              meta="Locked accounts"
              accent="destructive"
            />
            <SuperMetric
              code="S-06"
              icon={DollarSign}
              value={`$${(hereCosts.last24h.costCents / 100).toFixed(2)}`}
              label="HERE 24h"
              meta={`${hereCosts.last24h.requests} paid req`}
              accent="success"
            />
          </div>
        </section>

        {/* Section 2 — Sovereign actions */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="eyebrow-signal">§ 02 · Sovereign actions</span>
              <h2 className="text-xl font-semibold tracking-tight mt-1">
                Cross-tenant control surfaces
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <SuperOpsCard
              code="S-02"
              icon={Building2}
              title="Admins"
              caption="Suspend, restore, delete"
              href="/super-admin/admins"
              danger
            />
            <SuperOpsCard
              code="S-07"
              icon={DollarSign}
              title="Costs"
              caption="API spend by tenant"
              href="/super-admin/costs"
            />
            <SuperOpsCard
              code="S-06"
              icon={FileText}
              title="Audit log"
              caption="Every sovereign action"
              href="/super-admin/audit-log"
            />
            <SuperOpsCard
              code="S-08"
              icon={Database}
              title="System health"
              caption="Database, performance"
              href="/super-admin/system"
            />
          </div>
        </section>

        {/* Section 3 — HERE cost summary detail */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="eyebrow-signal">§ 03 · HERE API spend</span>
              <h2 className="text-xl font-semibold tracking-tight mt-1">
                Money on the wire
              </h2>
            </div>
            <Link href="/super-admin/costs">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal hover:underline underline-offset-4 inline-flex items-center gap-1">
                Full breakdown
                <ArrowUpRight className="size-3" strokeWidth={2.5} />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-sm overflow-hidden bg-card">
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
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.l}
                </div>
                <div className="font-mono text-2xl font-semibold tracking-tight mt-1.5 text-success">
                  {s.v}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
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

/* ------- super metric tile ------- */
function SuperMetric({
  code,
  icon: Icon,
  value,
  label,
  meta,
  accent,
}: {
  code: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: string | number
  label: string
  meta: string
  accent: "signal" | "success" | "info" | "warning" | "destructive"
}) {
  const accentMap = {
    signal: "text-signal",
    success: "text-success",
    info: "text-info",
    warning: "text-warning",
    destructive: "text-destructive",
  }
  const borderMap = {
    signal: "border-border",
    success: "border-border",
    info: "border-border",
    warning: "border-border",
    destructive: "border-destructive/30 bg-destructive-soft",
  }

  return (
    <div
      className={`metric-card ${borderMap[accent]} group`}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
          {code}
        </span>
        <Icon
          className={`size-4 ${accentMap[accent]} opacity-70 group-hover:opacity-100 transition-opacity`}
          strokeWidth={1.6}
        />
      </div>
      <div className={`font-mono text-3xl font-semibold tracking-tight ${accentMap[accent]} mb-1`}>
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="text-xs text-muted-foreground/80 mt-3 pt-3 border-t border-border">
        {meta}
      </div>
    </div>
  )
}

function SuperOpsCard({
  code,
  icon: Icon,
  title,
  caption,
  href,
  danger = false,
}: {
  code: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  caption: string
  href: string
  danger?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group relative border bg-card hover:bg-surface-2 transition-all duration-200 p-5 overflow-hidden ${
        danger
          ? "border-destructive/30 hover:border-destructive/60 bg-destructive-soft/40"
          : "border-border hover:border-border-strong"
      }`}
    >
      <div className="flex items-center justify-between mb-7">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.16em] ${danger ? "text-destructive" : "text-signal"}`}
        >
          {code}
        </span>
        <ArrowUpRight
          className={`size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ${
            danger
              ? "text-destructive/60 group-hover:text-destructive"
              : "text-muted-foreground group-hover:text-signal"
          }`}
          strokeWidth={1.6}
        />
      </div>

      <Icon
        className={`size-7 mb-4 ${danger ? "text-destructive" : "text-foreground"} group-hover:scale-105 transition-transform`}
        strokeWidth={1.4}
      />

      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>

      <div
        className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${danger ? "bg-destructive" : "bg-signal"}`}
      />
    </Link>
  )
}
