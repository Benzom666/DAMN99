"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DriverPerformanceChartsProps {
  drivers: any[]
  routes: any[]
  orders: any[]
  pods: any[]
  onExport: () => void
}

export function DriverPerformanceCharts({ drivers, routes, orders, pods, onExport }: DriverPerformanceChartsProps) {
  // Driver performance data
  const driverPerformance = drivers.map((driver) => {
    const driverRoutes = routes.filter((r) => r.driver_id === driver.id)
    const driverOrders = orders.filter((o) => o.route?.driver_id === driver.id)
    const driverPODs = pods.filter((p) => p.driver_id === driver.id)

    return {
      name: driver.display_name || driver.email.split("@")[0],
      delivered: driverOrders.filter((o) => o.status === "delivered").length,
      failed: driverOrders.filter((o) => o.status === "failed").length,
      routes: driverRoutes.length,
      photoRate:
        driverPODs.length > 0
          ? Math.round((driverPODs.filter((p) => p.photo_url).length / driverPODs.length) * 100)
          : 0,
      signatureRate:
        driverPODs.length > 0
          ? Math.round((driverPODs.filter((p) => p.signature_url).length / driverPODs.length) * 100)
          : 0,
    }
  })

  // POD capture rates by driver
  const podCaptureData = drivers
    .map((driver) => {
      const driverPODs = pods.filter((p) => p.driver_id === driver.id)
      return {
        name: driver.display_name || driver.email.split("@")[0],
        photos: driverPODs.filter((p) => p.photo_url).length,
        signatures: driverPODs.filter((p) => p.signature_url).length,
        total: driverPODs.length,
      }
    })
    .filter((d) => d.total > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Driver Performance</h3>
          <p className="text-sm text-muted-foreground">Individual driver metrics and productivity</p>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Drivers
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Delivery Performance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Driver Delivery Performance</CardTitle>
            <CardDescription>Successful vs failed deliveries by driver</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                delivered: { label: "Delivered", color: "#22c55e" },
                failed: { label: "Failed", color: "#ef4444" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="delivered" fill="#22c55e" />
                  <Bar dataKey="failed" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* POD Capture Rates */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>POD Capture Rates by Driver</CardTitle>
            <CardDescription>Photo and signature collection performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                photos: { label: "Photos", color: "#3b82f6" },
                signatures: { label: "Signatures", color: "#8b5cf6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={podCaptureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="photos" fill="#3b82f6" />
                  <Bar dataKey="signatures" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Driver Summary Table */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Driver Summary</CardTitle>
            <CardDescription>Comprehensive driver statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Driver</th>
                    <th className="text-right p-2">Routes</th>
                    <th className="text-right p-2">Delivered</th>
                    <th className="text-right p-2">Failed</th>
                    <th className="text-right p-2">Photo Rate</th>
                    <th className="text-right p-2">Signature Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.map((driver, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{driver.name}</td>
                      <td className="text-right p-2">{driver.routes}</td>
                      <td className="text-right p-2 text-green-600">{driver.delivered}</td>
                      <td className="text-right p-2 text-red-600">{driver.failed}</td>
                      <td className="text-right p-2">{driver.photoRate}%</td>
                      <td className="text-right p-2">{driver.signatureRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
