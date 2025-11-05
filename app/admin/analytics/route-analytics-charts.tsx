"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RouteAnalyticsChartsProps {
  routes: any[]
  orders: any[]
  onExport: () => void
}

export function RouteAnalyticsCharts({ routes, orders, onExport }: RouteAnalyticsChartsProps) {
  // Route efficiency data
  const routeEfficiency = routes
    .map((route) => {
      const routeOrders = orders.filter((o) => o.route_id === route.id)
      const delivered = routeOrders.filter((o) => o.status === "delivered").length
      const total = routeOrders.length
      const efficiency = total > 0 ? (delivered / total) * 100 : 0

      return {
        name: route.name.length > 20 ? route.name.substring(0, 20) + "..." : route.name,
        efficiency: Math.round(efficiency),
        delivered,
        total,
        distance: route.distance_km || 0,
        duration: route.duration_sec ? Math.round(route.duration_sec / 60) : 0,
      }
    })
    .slice(0, 10) // Top 10 routes

  // Route status distribution
  const statusData = [
    { status: "Active", count: routes.filter((r) => r.status === "active").length },
    { status: "Completed", count: routes.filter((r) => r.status === "completed").length },
    { status: "Draft", count: routes.filter((r) => r.status === "draft").length },
  ].filter((d) => d.count > 0)

  // Average stops per route
  const avgStopsData = routes
    .map((route) => {
      const routeOrders = orders.filter((o) => o.route_id === route.id)
      return {
        name: route.name.length > 15 ? route.name.substring(0, 15) + "..." : route.name,
        stops: routeOrders.length,
      }
    })
    .slice(0, 10)

  // Distance vs Duration analysis
  const distanceDurationData = routes
    .filter((r) => r.distance_km && r.duration_sec)
    .map((route) => ({
      name: route.name.length > 15 ? route.name.substring(0, 15) + "..." : route.name,
      distance: Math.round(route.distance_km * 10) / 10,
      duration: Math.round(route.duration_sec / 60),
    }))
    .slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Route Analytics</h3>
          <p className="text-sm text-muted-foreground">Route performance and optimization insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Routes
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Route Efficiency */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Route Delivery Efficiency</CardTitle>
            <CardDescription>Completion rate by route (top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                efficiency: { label: "Efficiency %", color: "#22c55e" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeEfficiency} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="efficiency" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Route Status */}
        <Card>
          <CardHeader>
            <CardTitle>Route Status Distribution</CardTitle>
            <CardDescription>Current status of all routes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Count", color: "#3b82f6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stops per Route */}
        <Card>
          <CardHeader>
            <CardTitle>Stops per Route</CardTitle>
            <CardDescription>Route complexity analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                stops: { label: "Stops", color: "#8b5cf6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avgStopsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="stops" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distance vs Duration */}
        {distanceDurationData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Distance vs Duration Analysis</CardTitle>
              <CardDescription>Route efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  distance: { label: "Distance (km)", color: "#f59e0b" },
                  duration: { label: "Duration (min)", color: "#06b6d4" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={distanceDurationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#f59e0b" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
