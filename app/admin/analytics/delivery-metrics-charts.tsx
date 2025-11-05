"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DeliveryMetricsChartsProps {
  orders: any[]
  stopEvents: any[]
  onExport: () => void
}

export function DeliveryMetricsCharts({ orders, stopEvents, onExport }: DeliveryMetricsChartsProps) {
  // Status distribution
  const statusData = [
    { name: "Delivered", value: orders.filter((o) => o.status === "delivered").length, color: "#22c55e" },
    { name: "Failed", value: orders.filter((o) => o.status === "failed").length, color: "#ef4444" },
    { name: "Pending", value: orders.filter((o) => o.status === "pending").length, color: "#f59e0b" },
    { name: "Assigned", value: orders.filter((o) => o.status === "assigned").length, color: "#3b82f6" },
  ].filter((d) => d.value > 0)

  // Daily delivery trend (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split("T")[0]
  })

  const dailyTrend = last30Days.map((date) => {
    const dayOrders = orders.filter((o) => o.created_at?.startsWith(date))
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      delivered: dayOrders.filter((o) => o.status === "delivered").length,
      failed: dayOrders.filter((o) => o.status === "failed").length,
      total: dayOrders.length,
    }
  })

  // Hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourOrders = orders.filter((o) => {
      if (!o.created_at) return false
      const orderHour = new Date(o.created_at).getHours()
      return orderHour === hour
    })
    return {
      hour: `${hour}:00`,
      orders: hourOrders.length,
    }
  })

  // Stop events timeline
  const eventTypes = ["delivered", "failed", "arrived"]
  const eventData = eventTypes.map((type) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count: stopEvents.filter((e) => e.event_type === type).length,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Delivery Metrics</h3>
          <p className="text-sm text-muted-foreground">Comprehensive order and delivery statistics</p>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Orders
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of all orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                delivered: { label: "Delivered", color: "#22c55e" },
                failed: { label: "Failed", color: "#ef4444" },
                pending: { label: "Pending", color: "#f59e0b" },
                assigned: { label: "Assigned", color: "#3b82f6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stop Events */}
        <Card>
          <CardHeader>
            <CardTitle>Stop Events</CardTitle>
            <CardDescription>Driver activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Count", color: "#3b82f6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>30-Day Delivery Trend</CardTitle>
            <CardDescription>Daily order volume and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                delivered: { label: "Delivered", color: "#22c55e" },
                failed: { label: "Failed", color: "#ef4444" },
                total: { label: "Total", color: "#3b82f6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Hourly Order Distribution</CardTitle>
            <CardDescription>Order volume by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                orders: { label: "Orders", color: "#8b5cf6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
