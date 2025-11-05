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

interface PODAnalyticsChartsProps {
  pods: any[]
  podEmails: any[]
  orders: any[]
  onExport: () => void
}

export function PODAnalyticsCharts({ pods, podEmails, orders, onExport }: PODAnalyticsChartsProps) {
  // POD completion data
  const podCompletionData = [
    { name: "With Photo", value: pods.filter((p) => p.photo_url).length, color: "#3b82f6" },
    { name: "With Signature", value: pods.filter((p) => p.signature_url).length, color: "#8b5cf6" },
    { name: "With Both", value: pods.filter((p) => p.photo_url && p.signature_url).length, color: "#22c55e" },
    { name: "With Neither", value: pods.filter((p) => !p.photo_url && !p.signature_url).length, color: "#ef4444" },
  ].filter((d) => d.value > 0)

  // Email delivery trend (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split("T")[0]
  })

  const emailTrend = last30Days.map((date) => {
    const dayEmails = podEmails.filter((e) => e.sent_at?.startsWith(date))
    const dayPODs = pods.filter((p) => p.delivered_at?.startsWith(date))
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      emails: dayEmails.length,
      pods: dayPODs.length,
    }
  })

  // POD capture time distribution
  const hourlyPODs = Array.from({ length: 24 }, (_, hour) => {
    const hourPODs = pods.filter((p) => {
      if (!p.delivered_at) return false
      const podHour = new Date(p.delivered_at).getHours()
      return podHour === hour
    })
    return {
      hour: `${hour}:00`,
      count: hourPODs.length,
    }
  })

  // Recipient name completion rate
  const recipientData = [
    { name: "With Recipient", value: pods.filter((p) => p.recipient_name).length },
    { name: "Without Recipient", value: pods.filter((p) => !p.recipient_name).length },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">POD Analytics</h3>
          <p className="text-sm text-muted-foreground">Proof of delivery capture and email metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export PODs
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* POD Completion Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>POD Completion Quality</CardTitle>
            <CardDescription>Photo and signature capture rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                photo: { label: "With Photo", color: "#3b82f6" },
                signature: { label: "With Signature", color: "#8b5cf6" },
                both: { label: "With Both", color: "#22c55e" },
                neither: { label: "With Neither", color: "#ef4444" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={podCompletionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {podCompletionData.map((entry, index) => (
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

        {/* Recipient Name Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Recipient Name Capture</CardTitle>
            <CardDescription>Recipient information completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Count", color: "#f59e0b" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recipientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Email Delivery Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>POD Email Delivery Trend</CardTitle>
            <CardDescription>PODs created vs emails sent (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pods: { label: "PODs Created", color: "#3b82f6" },
                emails: { label: "Emails Sent", color: "#22c55e" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emailTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="pods" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="emails" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hourly POD Distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>POD Capture Time Distribution</CardTitle>
            <CardDescription>When PODs are being captured throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "PODs", color: "#8b5cf6" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyPODs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* POD Statistics Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>POD Statistics Summary</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total PODs</p>
                <p className="text-2xl font-bold">{pods.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">With Photos</p>
                <p className="text-2xl font-bold text-blue-600">{pods.filter((p) => p.photo_url).length}</p>
                <p className="text-xs text-muted-foreground">
                  {pods.length > 0 ? Math.round((pods.filter((p) => p.photo_url).length / pods.length) * 100) : 0}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">With Signatures</p>
                <p className="text-2xl font-bold text-purple-600">{pods.filter((p) => p.signature_url).length}</p>
                <p className="text-xs text-muted-foreground">
                  {pods.length > 0 ? Math.round((pods.filter((p) => p.signature_url).length / pods.length) * 100) : 0}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold text-green-600">{podEmails.length}</p>
                <p className="text-xs text-muted-foreground">
                  {pods.length > 0 ? Math.round((podEmails.length / pods.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
