"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, TrendingUp, Package, Clock, Users, FileText, Camera, PenTool, Mail } from "lucide-react"
import { useState } from "react"
import { DeliveryMetricsCharts } from "./delivery-metrics-charts"
import { RouteAnalyticsCharts } from "./route-analytics-charts"
import { DriverPerformanceCharts } from "./driver-performance-charts"
import { PODAnalyticsCharts } from "./pod-analytics-charts"
import { exportToCSV, exportToJSON, generateDailyLogFile } from "./export-utils"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsDashboardProps {
  orders: any[]
  routes: any[]
  pods: any[]
  podEmails: any[]
  drivers: any[]
  stopEvents: any[]
}

export function AnalyticsDashboard({ orders, routes, pods, podEmails, drivers, stopEvents }: AnalyticsDashboardProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  // Calculate key metrics
  const totalOrders = orders.length
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length
  const failedOrders = orders.filter((o) => o.status === "failed").length
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "assigned").length
  const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : "0"

  const totalRoutes = routes.length
  const activeRoutes = routes.filter((r) => r.status === "active").length
  const completedRoutes = routes.filter((r) => r.status === "completed").length

  const totalPODs = pods.length
  const podsWithPhoto = pods.filter((p) => p.photo_url).length
  const podsWithSignature = pods.filter((p) => p.signature_url).length
  const photoRate = totalPODs > 0 ? ((podsWithPhoto / totalPODs) * 100).toFixed(1) : "0"
  const signatureRate = totalPODs > 0 ? ((podsWithSignature / totalPODs) * 100).toFixed(1) : "0"

  const emailsSent = podEmails.length
  const emailRate = totalPODs > 0 ? ((emailsSent / totalPODs) * 100).toFixed(1) : "0"

  const activeDrivers = drivers.length

  // Calculate average delivery time
  const deliveredOrdersWithTime = orders.filter(
    (o) => o.status === "delivered" && o.created_at && pods.find((p) => p.order_id === o.id)?.delivered_at,
  )
  const avgDeliveryTimeMinutes =
    deliveredOrdersWithTime.length > 0
      ? deliveredOrdersWithTime.reduce((acc, order) => {
          const pod = pods.find((p) => p.order_id === order.id)
          if (!pod) return acc
          const created = new Date(order.created_at).getTime()
          const delivered = new Date(pod.delivered_at).getTime()
          return acc + (delivered - created) / 1000 / 60
        }, 0) / deliveredOrdersWithTime.length
      : 0

  const avgDeliveryTimeFormatted =
    avgDeliveryTimeMinutes > 60
      ? `${(avgDeliveryTimeMinutes / 60).toFixed(1)}h`
      : `${Math.round(avgDeliveryTimeMinutes)}m`

  const handleExportCSV = async (dataType: string) => {
    setIsExporting(true)
    try {
      let data: any[] = []
      let filename = ""

      switch (dataType) {
        case "orders":
          data = orders.map((o) => {
            const pod = pods.find((p) => p.order_id === o.id)
            return {
              order_number: o.order_number || o.id.substring(0, 8),
              customer_name: o.customer_name,
              address: o.address,
              city: o.city,
              state: o.state,
              zip: o.zip,
              phone: o.phone,
              status: o.status,
              route_name: o.route?.name || "Unassigned",
              driver: o.route?.driver?.display_name || o.route?.driver?.email || "Unassigned",
              created_at: o.created_at,
              pod_photo_url: pod?.photo_url || "",
              pod_signature_url: pod?.signature_url || "",
              pod_recipient: pod?.recipient_name || "",
              pod_notes: pod?.notes || "",
              pod_delivered_at: pod?.delivered_at || "",
            }
          })
          filename = `orders-export-${new Date().toISOString().split("T")[0]}.csv`
          break

        case "routes":
          data = routes.map((r) => {
            const routeOrders = orders.filter((o) => o.route_id === r.id)
            const delivered = routeOrders.filter((o) => o.status === "delivered").length
            const failed = routeOrders.filter((o) => o.status === "failed").length
            return {
              route_name: r.name,
              driver: r.driver?.display_name || r.driver?.email || "Unassigned",
              status: r.status,
              total_stops: routeOrders.length,
              delivered_stops: delivered,
              failed_stops: failed,
              pending_stops: routeOrders.length - delivered - failed,
              distance_km: r.distance_km || 0,
              duration_sec: r.duration_sec || 0,
              created_at: r.created_at,
              updated_at: r.updated_at,
            }
          })
          filename = `routes-export-${new Date().toISOString().split("T")[0]}.csv`
          break

        case "pods":
          data = pods.map((p) => ({
            order_number: p.order?.order_number || "N/A",
            customer_name: p.order?.customer_name || "N/A",
            address: p.order?.address || "N/A",
            photo_url: p.photo_url || "",
            signature_url: p.signature_url || "",
            recipient_name: p.recipient_name || "",
            notes: p.notes || "",
            delivered_at: p.delivered_at,
            has_photo: p.photo_url ? "Yes" : "No",
            has_signature: p.signature_url ? "Yes" : "No",
          }))
          filename = `pods-export-${new Date().toISOString().split("T")[0]}.csv`
          break

        case "drivers":
          data = drivers.map((d) => {
            const driverRoutes = routes.filter((r) => r.driver_id === d.id)
            const driverOrders = orders.filter((o) => o.route?.driver_id === d.id)
            const driverPODs = pods.filter((p) => p.driver_id === d.id)
            return {
              name: d.display_name || d.email,
              email: d.email,
              total_routes: driverRoutes.length,
              total_deliveries: driverOrders.filter((o) => o.status === "delivered").length,
              failed_deliveries: driverOrders.filter((o) => o.status === "failed").length,
              total_pods: driverPODs.length,
              photo_capture_rate:
                driverPODs.length > 0 ? (driverPODs.filter((p) => p.photo_url).length / driverPODs.length) * 100 : 0,
              signature_capture_rate:
                driverPODs.length > 0
                  ? (driverPODs.filter((p) => p.signature_url).length / driverPODs.length) * 100
                  : 0,
            }
          })
          filename = `drivers-export-${new Date().toISOString().split("T")[0]}.csv`
          break
      }

      exportToCSV(data, filename)
      toast({
        title: "Export Successful",
        description: `${filename} has been downloaded.`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async (dataType: string) => {
    setIsExporting(true)
    try {
      let data: any = {}
      let filename = ""

      switch (dataType) {
        case "all":
          data = {
            orders: orders.map((o) => ({
              ...o,
              pod: pods.find((p) => p.order_id === o.id),
            })),
            routes,
            pods,
            podEmails,
            drivers,
            stopEvents,
            exportedAt: new Date().toISOString(),
          }
          filename = `complete-analytics-${new Date().toISOString().split("T")[0]}.json`
          break
      }

      exportToJSON(data, filename)
      toast({
        title: "Export Successful",
        description: `${filename} has been downloaded.`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateDailyLog = async () => {
    setIsExporting(true)
    try {
      const logContent = generateDailyLogFile({
        orders,
        routes,
        pods,
        podEmails,
        drivers,
        stopEvents,
      })

      const blob = new Blob([logContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `daily-log-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Daily Log Generated",
        description: "Daily log file has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "An error occurred while generating the daily log.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive delivery metrics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateDailyLog} disabled={isExporting}>
            <FileText className="mr-2 h-4 w-4" />
            Daily Log
          </Button>
          <Button variant="outline" onClick={() => handleExportJSON("all")} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            Export All (JSON)
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {deliveredOrders} delivered, {failedOrders} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">Success rate across all orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryTimeFormatted}</div>
            <p className="text-xs text-muted-foreground">From order to delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDrivers}</div>
            <p className="text-xs text-muted-foreground">{activeRoutes} routes in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* POD Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photo Capture Rate</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photoRate}%</div>
            <p className="text-xs text-muted-foreground">
              {podsWithPhoto} of {totalPODs} PODs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signature Capture Rate</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signatureRate}%</div>
            <p className="text-xs text-muted-foreground">
              {podsWithSignature} of {totalPODs} PODs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Delivery Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailRate}%</div>
            <p className="text-xs text-muted-foreground">{emailsSent} emails sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="deliveries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deliveries">Delivery Metrics</TabsTrigger>
          <TabsTrigger value="routes">Route Analytics</TabsTrigger>
          <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
          <TabsTrigger value="pods">POD Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="space-y-4">
          <DeliveryMetricsCharts orders={orders} stopEvents={stopEvents} onExport={() => handleExportCSV("orders")} />
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <RouteAnalyticsCharts routes={routes} orders={orders} onExport={() => handleExportCSV("routes")} />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <DriverPerformanceCharts
            drivers={drivers}
            routes={routes}
            orders={orders}
            pods={pods}
            onExport={() => handleExportCSV("drivers")}
          />
        </TabsContent>

        <TabsContent value="pods" className="space-y-4">
          <PODAnalyticsCharts
            pods={pods}
            podEmails={podEmails}
            orders={orders}
            onExport={() => handleExportCSV("pods")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
