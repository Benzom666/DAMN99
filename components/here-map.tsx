"use client"

import { useEffect, useRef, useState } from "react"
import { getHereApiKey } from "@/app/actions/get-here-api-key"
import { segmentShape } from "@/lib/here/segment-shape"
import { km } from "@/lib/utils/haversine"

const isBrowser = typeof window !== "undefined"

declare global {
  interface Window {
    H: any
  }
}

type LatLng = {
  lat: number
  lng: number
  label?: string
  color?: string
  status?: string
  address?: string
  /** Display name of the customer (delivery stops). */
  customerName?: string
  /** Legacy alias some callers use to carry the customer name. */
  customerId?: string
  /** Phone number (rendered as a tel: link). */
  phone?: string
  /** Marker kind — controls the popup style. */
  kind?: "stop" | "driver" | "depot"
  /** ISO timestamp of the last update (driver markers). */
  updatedAt?: string
}

// ---------------------------------------------------------------------------
// Styled marker popup (InfoBubble) helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<string, { label: string; color: string }> = {
  delivered: { label: "Delivered", color: "#16a34a" },
  failed: { label: "Failed", color: "#dc2626" },
  assigned: { label: "Pending", color: "#2563eb" },
  pending: { label: "Pending", color: "#2563eb" },
  in_transit: { label: "In transit", color: "#d97706" },
  driver: { label: "Live driver", color: "#7c3aed" },
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  )
}

function timeAgo(iso?: string): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return null
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} d ago`
}

/** Inject a one-time stylesheet that restyles HERE's default bubble chrome
 *  (otherwise the bubble is a large unstyled white block). */
function injectBubbleStyles(): void {
  if (!isBrowser) return
  if (document.getElementById("hm-bubble-style")) return
  const style = document.createElement("style")
  style.id = "hm-bubble-style"
  style.textContent = `
    .H_ib_body{padding:0!important;border:0!important;background:transparent!important;
      box-shadow:0 12px 32px rgba(15,23,42,.18)!important;border-radius:14px!important;}
    .H_ib_content{margin:0!important;border-radius:14px!important;overflow:hidden;
      background:#fff!important;border:1px solid #e7ecf3!important;}
    .H_ib_close{top:7px!important;right:7px!important;border-radius:6px!important;}
    .H_ib_tail{display:none!important;}
  `
  document.head.appendChild(style)
}

function row(icon: string, html: string): string {
  return `<div style="display:flex;gap:7px;font-size:12.5px;color:#334155;line-height:1.4;">
    <span style="flex:0 0 auto;opacity:.7;">${icon}</span>
    <span style="min-width:0;word-break:break-word;">${html}</span></div>`
}

/** Build the HTML for a marker's detail popup. Self-contained inline styles so
 *  it renders identically regardless of app CSS. */
function buildBubbleContent(d: any): string {
  const isDepot = d.isDepot || d.kind === "depot"
  const isDriver = !isDepot && (d.kind === "driver" || d.status === "driver")
  const meta = STATUS_META[d.status as string] || { label: String(d.status || ""), color: "#475569" }
  const accent = isDepot ? "#0d9488" : isDriver ? "#7c3aed" : d.color || meta.color
  const customer = d.customerName || d.customerId || ""

  const headIcon = isDepot ? "🏢" : isDriver ? "🚗" : "📦"
  const title = isDepot
    ? "Depot"
    : isDriver
      ? escapeHtml(customer || d.address || "Driver")
      : `Stop ${escapeHtml(d.label ?? "")}`
  const subtitle = isDepot ? "Route start / end" : isDriver ? "Live driver location" : "Delivery stop"

  const rows: string[] = []
  if (!isDepot && !isDriver && customer) rows.push(row("👤", escapeHtml(customer)))
  if (d.address && !isDriver) {
    // Make the address a tap target that opens Google Maps directions to the
    // exact pin (lat,lng when available, else the address text). Origin is the
    // viewer's current location.
    const dest =
      Number.isFinite(d.lat) && Number.isFinite(d.lng)
        ? `${d.lat},${d.lng}`
        : encodeURIComponent(String(d.address))
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    rows.push(
      row(
        "📍",
        `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:none;">${escapeHtml(d.address)}<span style="white-space:nowrap;color:#94a3b8;font-size:11px;"> · Directions ↗</span></a>`,
      ),
    )
  }
  if (d.phone)
    rows.push(
      row(
        "📞",
        `<a href="tel:${escapeHtml(d.phone)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(d.phone)}</a>`,
      ),
    )
  if (isDriver) {
    const ago = timeAgo(d.updatedAt)
    if (ago) rows.push(row("🕘", `Updated ${escapeHtml(ago)}`))
  }

  const pill = isDriver
    ? `<span style="align-self:flex-start;display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:#16a34a1a;color:#16a34a;font-size:11px;font-weight:600;">
        <span style="width:6px;height:6px;border-radius:999px;background:#16a34a;display:inline-block;"></span>Live</span>`
    : !isDepot && d.status
      ? `<span style="align-self:flex-start;padding:3px 9px;border-radius:999px;background:${meta.color}1a;color:${meta.color};font-size:11px;font-weight:600;">${escapeHtml(meta.label)}</span>`
      : ""

  const coords =
    Number.isFinite(d.lat) && Number.isFinite(d.lng)
      ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</div>`
      : ""

  return `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;width:248px;color:#0f172a;">
    <div style="display:flex;align-items:center;gap:9px;padding:12px 14px 10px;border-bottom:1px solid #eef2f7;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:${accent}1a;font-size:15px;flex:0 0 auto;">${headIcon}</span>
      <div style="min-width:0;">
        <div style="font-weight:700;font-size:14px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
        <div style="font-size:11px;color:#64748b;line-height:1.3;">${subtitle}</div>
      </div>
    </div>
    <div style="padding:11px 14px 13px;display:flex;flex-direction:column;gap:7px;">
      ${rows.join("")}
      ${pill}
      ${coords}
    </div>
  </div>`
}

async function loadHereScripts(apiKey: string): Promise<void> {
  if (!isBrowser) return

  // HERE UI stylesheet — REQUIRED for InfoBubble to render as a styled card.
  // Without it the bubble appears as a large unstyled white block.
  const cssHref = "https://js.api.here.com/v3/3.1/mapsjs-ui.css"
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = cssHref
    document.head.appendChild(link)
  }
  injectBubbleStyles()

  if (window.H?.Map) return // Already loaded

  const scripts = [
    "https://js.api.here.com/v3/3.1/mapsjs-core.js",
    "https://js.api.here.com/v3/3.1/mapsjs-service.js",
    "https://js.api.here.com/v3/3.1/mapsjs-ui.js",
    "https://js.api.here.com/v3/3.1/mapsjs-mapevents.js",
  ]

  // Load scripts sequentially
  for (const src of scripts) {
    if (document.querySelector(`script[src="${src}"]`)) continue

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.head.appendChild(script)
    })
  }

  // Wait for H to be available
  let attempts = 0
  while (!window.H && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  if (!window.H) {
    throw new Error("HERE Maps SDK failed to initialize")
  }
}

export function HereMap({
  points = [],
  markers = [],
  polylines = [],
  depot,
  focusNextStop = false,
  useRoadPolylines = false,
  height = 420,
  className = "",
}: {
  points?: LatLng[]
  markers?: LatLng[]
  polylines?: LatLng[][]
  depot?: LatLng
  focusNextStop?: boolean
  useRoadPolylines?: boolean
  height?: number
  className?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const allPoints = [...points, ...markers]

  useEffect(() => {
    async function fetchKey() {
      try {
        const key = await getHereApiKey()
        if (!key) {
          setError("HERE API key not configured. Set HERE_API_KEY in environment variables.")
          return
        }
        setApiKey(key)
      } catch (err) {
        console.error("[v0] Error fetching HERE API key:", err)
        setError("Failed to load API key")
      }
    }
    fetchKey()
  }, [])

  useEffect(() => {
    if (!isBrowser) {
      setError("Loading map...")
      return
    }

    let cancelled = false
    let map: any = null
    let behavior: any = null
    let ui: any = null

    async function initMap() {
      try {
        if (!mapRef.current) return
        if (!apiKey) return

        console.log("[v0] [HERE_MAP] Initializing HERE Map...")

        await loadHereScripts(apiKey)

        if (cancelled) return

        const H = window.H

        const platform = new H.service.Platform({ apikey: apiKey })
        const defaultLayers = platform.createDefaultLayers()

        map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
          center: allPoints.length > 0 ? allPoints[0] : { lat: 45.42, lng: -75.69 },
          zoom: 12,
          pixelRatio: window.devicePixelRatio || 1,
        })

        behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map))
        ui = H.ui.UI.createDefault(map, defaultLayers)

        mapInstanceRef.current = map

        // Open a styled detail popup for a marker, closing any other open one
        // first so bubbles never stack on the map.
        const showBubble = (target: any) => {
          try {
            const existing = (ui.getBubbles && ui.getBubbles()) || []
            existing.forEach((b: any) => ui.removeBubble(b))
          } catch {}
          const bubble = new H.ui.InfoBubble(target.getGeometry(), {
            content: buildBubbleContent(target.getData()),
          })
          ui.addBubble(bubble)
        }

        const group = new H.map.Group()

        if (depot) {
          const depotSvg = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="24" height="24" fill="#10b981" stroke="white" strokeWidth="3" rx="4"/>
            <text x="20" y="26" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">D</text>
          </svg>`
          const depotIcon = new H.map.Icon(depotSvg)
          const depotMarker = new H.map.Marker(depot, { icon: depotIcon })
          depotMarker.setData({ label: "Depot", lat: depot.lat, lng: depot.lng, isDepot: true })
          depotMarker.addEventListener("tap", (e: any) => showBubble(e.target))

          group.addObject(depotMarker)
        }

        if (allPoints.length > 0) {
          console.log(`[v0] [HERE_MAP] Adding ${allPoints.length} markers to map`)

          allPoints.forEach((point, idx) => {
            if (
              !Number.isFinite(point.lat) ||
              !Number.isFinite(point.lng) ||
              point.lat < -90 ||
              point.lat > 90 ||
              point.lng < -180 ||
              point.lng > 180
            ) {
              console.warn(`[v0] [HERE_MAP] Invalid marker coordinates: lat=${point.lat}, lng=${point.lng}`)
              return
            }

            let icon
            if (point.color) {
              const svgMarkup = `<svg width="36" height="36" xmlns="http://www.w3.org/2000/svg" class="marker">
                <circle cx="18" cy="18" r="16" fill="${point.color}" stroke="white" strokeWidth="3"/>
                <text x="18" y="24" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">${point.label || idx + 1}</text>
              </svg>`
              icon = new H.map.Icon(svgMarkup)
            }

            const marker = icon ? new H.map.Marker(point, { icon }) : new H.map.Marker(point)
            const label = point.label || `${idx + 1}`
            marker.setData({
              label,
              lat: point.lat,
              lng: point.lng,
              status: point.status,
              address: point.address,
              color: point.color,
              customerName: point.customerName,
              customerId: point.customerId,
              phone: point.phone,
              kind: point.kind,
              updatedAt: point.updatedAt,
            })

            marker.addEventListener("tap", (e: any) => showBubble(e.target))

            group.addObject(marker)
          })
        }

        if (polylines.length > 0 && useRoadPolylines) {
          console.log(`[v0] [HERE_MAP] Fetching road-snapped polylines for ${polylines.length} route(s)`)

          for (const line of polylines) {
            const lineString = new H.geo.LineString()
            let totalDrift = 0
            let maxDrift = 0

            for (let i = 0; i < line.length - 1; i++) {
              const encodedSegment = await segmentShape(line[i], line[i + 1], apiKey)

              if (encodedSegment) {
                const segmentLine = H.geo.LineString.fromFlexiblePolyline(encodedSegment)
                const points = segmentLine.getLatLngAltArray()

                if (points.length >= 3) {
                  const firstPolyPoint = { lat: points[0], lng: points[1] }
                  const drift = km(line[i], firstPolyPoint)
                  totalDrift += drift
                  maxDrift = Math.max(maxDrift, drift)

                  if (drift > 0.05) {
                    console.warn(
                      `[v0] [HERE_MAP] Marker drift >${(drift * 1000) | 0}m at stop ${i + 1}:`,
                      `job=(${line[i].lat.toFixed(5)},${line[i].lng.toFixed(5)})`,
                      `poly=(${firstPolyPoint.lat.toFixed(5)},${firstPolyPoint.lng.toFixed(5)})`,
                    )
                  }
                }

                for (let j = i === 0 ? 0 : 3; j < points.length; j += 3) {
                  const lat = points[j]
                  const lng = points[j + 1]

                  if (
                    Number.isFinite(lat) &&
                    Number.isFinite(lng) &&
                    lat >= -90 &&
                    lat <= 90 &&
                    lng >= -180 &&
                    lng <= 180
                  ) {
                    lineString.pushLatLngAlt(lat, lng, 0)
                  } else {
                    console.warn(`[v0] [HERE_MAP] Invalid polyline coordinate: lat=${lat}, lng=${lng}`)
                  }
                }
              } else {
                if (i === 0) {
                  lineString.pushLatLngAlt(line[i].lat, line[i].lng, 0)
                }
                lineString.pushLatLngAlt(line[i + 1].lat, line[i + 1].lng, 0)
              }
            }

            const pointCount = lineString.getLatLngAltArray().length / 3
            console.log(
              `[v0] [HERE_MAP] Road polyline: ${pointCount} points, avg drift: ${((totalDrift / line.length) * 1000) | 0}m, max drift: ${(maxDrift * 1000) | 0}m`,
            )

            const polyline = new H.map.Polyline(lineString, {
              style: {
                strokeColor: "#3b82f6",
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
              },
            })
            group.addObject(polyline)
          }
        } else if (polylines.length > 0) {
          console.log(`[v0] [HERE_MAP] Drawing ${polylines.length} straight polyline(s)`)
          polylines.forEach((line) => {
            const lineString = new H.geo.LineString()
            line.forEach((p) => {
              if (
                Number.isFinite(p.lat) &&
                Number.isFinite(p.lng) &&
                p.lat >= -90 &&
                p.lat <= 90 &&
                p.lng >= -180 &&
                p.lng <= 180
              ) {
                lineString.pushLatLngAlt(p.lat, p.lng, 0)
              }
            })
            const polyline = new H.map.Polyline(lineString, {
              style: {
                strokeColor: "#3b82f6",
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
              },
            })
            group.addObject(polyline)
          })
        }

        map.addObject(group)

        if (group.getBoundingBox()) {
          map.getViewModel().setLookAtData({
            bounds: group.getBoundingBox(),
            padding: { top: 64, right: 64, bottom: 64, left: 64 },
          })
        }

        if (focusNextStop && allPoints.length > 0) {
          const nextStop = allPoints.find((p) => p.status !== "delivered" && p.status !== "failed")
          if (nextStop) {
            console.log(`[v0] [HERE_MAP] Focusing on next stop: ${nextStop.label}`)
            setTimeout(() => {
              map.getViewModel().setLookAtData({ position: nextStop, zoom: 16 }, true)
            }, 1000)
          }
        }

        const onResize = () => map.getViewPort().resize()
        window.addEventListener("resize", onResize)

        console.log("[v0] [HERE_MAP] ✓ Map initialized successfully")

        return () => {
          window.removeEventListener("resize", onResize)
          if (ui) ui.dispose()
          if (behavior) behavior.dispose()
          if (map) map.dispose()
        }
      } catch (err) {
        console.error("[v0] [HERE_MAP] ✗ Map error:", err)
        setError(err instanceof Error ? err.message : "Failed to load map")
      }
    }

    initMap()

    return () => {
      cancelled = true
      if (ui) ui.dispose()
      if (behavior) behavior.dispose()
      if (map) map.dispose()
    }
  }, [
    apiKey,
    JSON.stringify(allPoints),
    JSON.stringify(polylines),
    JSON.stringify(depot),
    focusNextStop,
    useRoadPolylines,
  ])

  if (error) {
    return (
      <div
        style={{ height: `${height}px` }}
        className={`w-full rounded border bg-red-50 flex items-center justify-center text-red-600 p-4 ${className}`}
      >
        <div className="text-center">
          <p className="font-semibold mb-2">Map Error</p>
          <p className="text-sm">{error}</p>
          {error.includes("API key") && (
            <p className="text-xs mt-2 text-muted-foreground">
              Set <code className="bg-red-100 px-1 rounded">HERE_API_KEY</code> in Vercel environment variables
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div
        style={{ height: `${height}px` }}
        className={`w-full rounded border bg-muted flex items-center justify-center text-muted-foreground ${className}`}
      >
        Loading map...
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{ height: `${height}px` }}
      className={`here-map-container w-full rounded border ${className}`}
    />
  )
}

export default HereMap
