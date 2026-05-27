"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, RotateCcw, Eye, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportRouteCSV, unarchiveRoute } from "../actions"

interface ArchivedRoute {
  id: string
  name: string
  driver_id: string | null
  status: string
  total_stops: number | null
  completed_stops: number | null
  archived_at: string | null
  completed_at: string | null
  created_at: string
  distance_km: number | null
  duration_sec: number | null
  driver: { display_name: string | null; email: string } | null
}

interface HistoryRow {
  id: string
  route_id: string | null
  name: string
  driver_name: string | null
  driver_email: string | null
  status: string
  total_stops: number
  completed_stops: number
  failed_stops: number
  distance_km: number | null
  duration_sec: number | null
  archived_at: string
  completed_at: string | null
  created_at: string | null
}

interface Props {
  archivedRoutes: ArchivedRoute[]
  historyRows: HistoryRow[]
}

interface Row {
  id: string // route_id when alive, history.id when only snapshot exists
  routeId: string | null
  name: string
  driverLabel: string
  status: string
  totalStops: number
  completedStops: number
  failedStops: number | null
  distanceKm: number | null
  durationSec: number | null
  archivedAt: string | null
  completedAt: string | null
  createdAt: string | null
  hasLiveRoute: boolean
}

function downloadCsv(filename: string, csv: string) {
  // BOM ensures Excel opens it as UTF-8
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function RouteHistoryTable({ archivedRoutes, historyRows }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  // Merge archived live routes + route_history snapshots, preferring the live
  // route entry when both exist (so the user sees the latest state).
  const rows: Row[] = useMemo(() => {
    const seen = new Set<string>()
    const merged: Row[] = []

    for (const r of archivedRoutes) {
      seen.add(r.id)
      merged.push({
        id: r.id,
        routeId: r.id,
        name: r.name,
        driverLabel: r.driver
          ? r.driver.display_name || r.driver.email
          : "Unassigned",
        status: r.status,
        totalStops: r.total_stops ?? 0,
        completedStops: r.completed_stops ?? 0,
        failedStops: null,
        distanceKm: r.distance_km,
        durationSec: r.duration_sec,
        archivedAt: r.archived_at,
        completedAt: r.completed_at,
        createdAt: r.created_at,
        hasLiveRoute: true,
      })
    }

    for (const h of historyRows) {
      if (h.route_id && seen.has(h.route_id)) continue
      merged.push({
        id: h.id,
        routeId: h.route_id,
        name: h.name,
        driverLabel: h.driver_name || h.driver_email || "Unassigned",
        status: h.status,
        totalStops: h.total_stops,
        completedStops: h.completed_stops,
        failedStops: h.failed_stops,
        distanceKm: h.distance_km,
        durationSec: h.duration_sec,
        archivedAt: h.archived_at,
        completedAt: h.completed_at,
        createdAt: h.created_at,
        hasLiveRoute: false,
      })
    }

    return merged
  }, [archivedRoutes, historyRows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.driverLabel.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    )
  }, [rows, search])

  async function handleExport(row: Row) {
    if (!row.routeId) {
      toast({
        title: "Cannot export",
        description: "This snapshot is missing its source route id.",
        variant: "destructive",
      })
      return
    }
    setExportingId(row.id)
    try {
      const result = await exportRouteCSV(row.routeId)
      downloadCsv(result.filename, result.csv)
      toast({
        title: "Export ready",
        description: `Downloaded ${result.filename}`,
      })
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      })
    } finally {
      setExportingId(null)
    }
  }

  async function handleRestore(row: Row) {
    if (!row.hasLiveRoute || !row.routeId) {
      toast({
        title: "Cannot restore",
        description:
          "This route only exists as a snapshot. Restore is only available for archived live routes.",
        variant: "destructive",
      })
      return
    }
    if (!confirm(`Restore route "${row.name}" back to active list?`)) return

    setRestoringId(row.id)
    try {
      await unarchiveRoute(row.routeId)
      toast({
        title: "Route restored",
        description: `"${row.name}" is back in your routes list.`,
      })
      router.refresh()
    } catch (err: any) {
      toast({
        title: "Restore failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      })
    } finally {
      setRestoringId(null)
    }
  }

  function formatDate(s: string | null) {
    if (!s) return "—"
    try {
      return new Date(s).toLocaleString()
    } catch {
      return s
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Archived routes</h2>
          <p className="text-muted-foreground">
            {filtered.length} of {rows.length} archived routes
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, driver, status…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stops</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Archived</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {rows.length === 0
                    ? "No archived routes yet. Archive a completed route from the Routes page to see it here."
                    : "No routes match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{row.name}</span>
                      {!row.hasLiveRoute && (
                        <span className="text-xs text-muted-foreground">
                          snapshot only
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{row.driverLabel}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.totalStops}</TableCell>
                  <TableCell className="text-success">
                    {row.completedStops}
                  </TableCell>
                  <TableCell className="text-destructive">
                    {row.failedStops ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.completedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.archivedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {row.hasLiveRoute && row.routeId && (
                        <Link href={`/admin/routes/${row.routeId}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Export CSV"
                        onClick={() => handleExport(row)}
                        disabled={exportingId === row.id || !row.routeId}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {row.hasLiveRoute && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Restore to active routes"
                          onClick={() => handleRestore(row)}
                          disabled={restoringId === row.id}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
