"use client"

import { Fragment, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ChevronDown, ChevronRight, Download } from "lucide-react"

interface Stop {
  order_number?: string | null
  customer_name?: string
  customer_email?: string | null
  address?: string
  city?: string | null
  phone?: string | null
  status?: string
  stop_sequence?: number | null
  pod_photo_url?: string | null
  pod_signature_url?: string | null
  pod_recipient_name?: string | null
  pod_delivered_at?: string | null
}

interface HistoryRow {
  id: string
  route_id: string | null
  name: string
  status: string
  total_stops: number
  completed_stops: number
  failed_stops: number
  distance_km: number | null
  duration_sec: number | null
  created_at: string | null
  completed_at: string | null
  archived_at: string
  driver_name: string | null
  driver_email: string | null
  admin?: { display_name: string | null; email: string } | null
  snapshot?: any
}

const csv = (v: unknown) => {
  const s = String(v ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function SuperAdminHistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) =>
      [r.name, r.driver_name, r.driver_email, r.admin?.display_name, r.admin?.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    )
  }, [rows, q])

  function exportCsv(r: HistoryRow) {
    const stops: Stop[] = r.snapshot?.stops || []
    const headers = ["Stop", "Order #", "Customer", "Email", "Address", "City", "Phone", "Status", "POD recipient", "POD delivered at", "Photo URL", "Signature URL"]
    const lines = [headers.join(",")]
    stops.forEach((s) => {
      lines.push(
        [
          s.stop_sequence ?? "",
          s.order_number ?? "",
          csv(s.customer_name),
          csv(s.customer_email ?? ""),
          csv(s.address),
          csv(s.city ?? ""),
          csv(s.phone ?? ""),
          s.status ?? "",
          csv(s.pod_recipient_name ?? ""),
          s.pod_delivered_at ?? "",
          s.pod_photo_url ?? "",
          s.pod_signature_url ?? "",
        ].join(","),
      )
    })
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `route_${(r.name || "route").replace(/[^a-z0-9]+/gi, "_")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search admin, route, driver…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Route</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Delivered / Failed / Total</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="text-right">CSV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No route history yet. Completed routes are recorded here automatically.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const stops: Stop[] = r.snapshot?.stops || []
                const isOpen = open === r.id
                return (
                  <Fragment key={r.id}>
                    <TableRow className="cursor-pointer" onClick={() => setOpen(isOpen ? null : r.id)}>
                      <TableCell>{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.admin?.display_name || r.admin?.email || "—"}</TableCell>
                      <TableCell>{r.driver_name || r.driver_email || "Unassigned"}</TableCell>
                      <TableCell className="tabular-nums">
                        <span className="text-success">{r.completed_stops}</span>
                        {" / "}
                        <span className="text-destructive">{r.failed_stops}</span>
                        {" / "}
                        {r.total_stops}
                      </TableCell>
                      <TableCell className="tabular-nums">{r.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : "—"}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.completed_at
                          ? new Date(r.completed_at).toLocaleDateString()
                          : new Date(r.archived_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); exportCsv(r) }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-0">
                          <div className="p-4 space-y-1.5">
                            {stops.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No stop details captured in this snapshot.</p>
                            ) : (
                              stops.map((s, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm border-b border-border/50 py-1.5 last:border-0">
                                  <span className="w-6 text-muted-foreground tabular-nums">{s.stop_sequence ?? i + 1}</span>
                                  <span className="font-medium min-w-[140px] truncate">{s.customer_name || "—"}</span>
                                  <span className="text-muted-foreground flex-1 truncate">
                                    {s.address}
                                    {s.city ? `, ${s.city}` : ""}
                                  </span>
                                  {s.order_number && <span className="text-xs text-muted-foreground font-mono">{s.order_number}</span>}
                                  <Badge variant={s.status === "delivered" ? "default" : s.status === "failed" ? "destructive" : "secondary"}>
                                    {s.status}
                                  </Badge>
                                  {s.pod_photo_url && (
                                    <a href={s.pod_photo_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">
                                      photo
                                    </a>
                                  )}
                                  {s.pod_signature_url && (
                                    <a href={s.pod_signature_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">
                                      sig
                                    </a>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
