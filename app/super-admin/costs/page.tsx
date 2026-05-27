import { requireSuperAdmin } from "@/lib/auth/super-admin"
import { getHereCostAnalytics } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AutoRefresh } from "./auto-refresh"
import { AlertTriangle, Clock, DollarSign, ShieldCheck, Zap, Key, Server } from "lucide-react"

export const dynamic = "force-dynamic"

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function serviceLabel(service: string) {
  return service.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function HereCostAnalyticsPage() {
  await requireSuperAdmin()
  const analytics = await getHereCostAnalytics()
  const services = Object.entries(analytics.last24h.byService)

  return (
    <div className="flex flex-col min-h-screen">
      <AutoRefresh />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">HERE Cost Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Refreshes every 30 seconds. Costs are estimated from configured HERE per-1000 request rates.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 space-y-6">
        {analytics.unavailable && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-3 pt-6 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>Usage table is not available yet. Run migration 021. {analytics.error}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated 24h Cost</CardTitle>
              <DollarSign className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{money(analytics.last24h.costCents)}</div>
              <p className="text-xs text-muted-foreground">{analytics.last24h.requests} paid requests</p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated 7d Cost</CardTitle>
              <Clock className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{money(analytics.last7d.costCents)}</div>
              <p className="text-xs text-muted-foreground">{analytics.last7d.requests} paid requests</p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated 30d Cost</CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{money(analytics.last30d.costCents)}</div>
              <p className="text-xs text-muted-foreground">{analytics.last30d.requests} paid requests</p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cache Hits 24h</CardTitle>
              <Zap className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.last24h.cacheHits}</div>
              <p className="text-xs text-muted-foreground">Requests avoided</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Key Usage (30d)</CardTitle>
              <Server className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.last30d.platformKeyRequests}</div>
              <p className="text-xs text-muted-foreground">
                {money(analytics.last30d.platformKeyCost)} estimated cost
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Client Keys Usage (30d)</CardTitle>
              <Key className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.last30d.ownKeyRequests}</div>
              <p className="text-xs text-muted-foreground">
                {money(analytics.last30d.ownKeyCost)} estimated cost (client-paid)
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>HERE API Free Tier Usage (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.freeTierUsage).map(([service, usage]: [string, any]) => (
                <div key={service} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{serviceLabel(service)}</span>
                    <span className="text-muted-foreground">
                      {usage.used.toLocaleString()} / {usage.limit.toLocaleString()} requests
                    </span>
                  </div>
                  <Progress value={usage.percentUsed} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{usage.percentUsed.toFixed(1)}% used</span>
                    <span>{usage.remaining.toLocaleString()} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="metric-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked 24h</CardTitle>
              <ShieldCheck className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.last24h.blocked}</div>
              <p className="text-xs text-muted-foreground">{analytics.last24h.errors} API errors</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usage By Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium">Service</th>
                    <th className="py-2 font-medium">Requests</th>
                    <th className="py-2 font-medium">Units</th>
                    <th className="py-2 font-medium">Cache Hits</th>
                    <th className="py-2 font-medium">Blocked</th>
                    <th className="py-2 font-medium">Errors</th>
                    <th className="py-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td className="py-4 text-muted-foreground" colSpan={7}>
                        No HERE usage logged in the last 24 hours.
                      </td>
                    </tr>
                  ) : (
                    services.map(([service, row]) => (
                      <tr key={service} className="border-b">
                        <td className="py-2 font-medium">{serviceLabel(service)}</td>
                        <td className="py-2">{row.requests}</td>
                        <td className="py-2">{row.units}</td>
                        <td className="py-2">{row.cacheHits}</td>
                        <td className="py-2">{row.blocked}</td>
                        <td className="py-2">{row.errors}</td>
                        <td className="py-2">{money(row.costCents)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent HERE Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent usage events.</p>
              ) : (
                analytics.recent.map((event: any, idx: number) => (
                  <div key={`${event.created_at}-${idx}`} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <div className="font-medium">
                        {event.service ? serviceLabel(event.service) : 'Unknown Service'} - {event.operation || 'unknown operation'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()} - {event.request_count || 0} requests -{" "}
                        {money(Number(event.estimated_cost_cents || 0))}
                      </div>
                      {event.error_message && <div className="text-xs text-destructive mt-1">{event.error_message}</div>}
                    </div>
                    <Badge variant={event.status === "error" || event.status === "blocked" ? "destructive" : "secondary"}>
                      {event.cache_hit ? "cache hit" : (event.status || 'unknown')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
