"use client"

import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Navigation,
  MapPin,
  Phone,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { HereMap } from "@/components/here-map"
import { useState, useEffect } from "react"
import { updateDriverPosition } from "@/app/driver/actions"

interface RouteDetailProps {
  route: any
  orders: any[]
}

export function RouteDetail({ route, orders }: RouteDetailProps) {
  const [showMap] = useState(true)
  const completedCount = orders.filter((o) => o.status === "delivered").length
  const failedCount = orders.filter((o) => o.status === "failed").length
  const pendingCount = orders.filter(
    (o) => o.status === "assigned" || o.status === "in_transit",
  ).length
  const progress =
    orders.length > 0
      ? ((completedCount + failedCount) / orders.length) * 100
      : 0

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("[v0] Geolocation not supported")
      return
    }

    let watchId: number

    const updatePosition = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      console.log("[v0] Driver position updated:", latitude, longitude)

      const result = await updateDriverPosition(latitude, longitude, accuracy)
      if (!result.success) {
        console.error("[v0] Failed to update driver position:", result.error)
      }
    }

    const handleError = (error: GeolocationPositionError) => {
      console.error("[v0] Geolocation error:", error.message)
    }

    watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    })

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  const markers = orders
    .filter((o) => o.latitude && o.longitude)
    .map((o) => ({
      lat: o.latitude,
      lng: o.longitude,
      label: o.stop_sequence?.toString() || "?",
      color:
        o.status === "delivered"
          ? "#16a34a" // green
          : o.status === "failed"
            ? "#dc2626" // red
            : "#facc15", // signal yellow
    }))

  const buildNavigationUrl = (lat: number, lng: number) => {
    return `https://www.here.com/directions/drive/${lat},${lng}`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30 relative">
        <div className="absolute top-0 left-0 right-0 h-1 hazard-stripe opacity-80" />
        <div className="px-4 sm:px-6 pt-4 pb-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/driver">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                  ACTIVE MANIFEST
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-success">
                  <span className="pulse-dot" />
                  GPS live
                </span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {route.name}
              </h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full ${progress === 100 ? "bg-success" : "bg-signal"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-[11px] tracking-tight tabular-nums">
              {completedCount + failedCount}/{orders.length}
            </span>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={pendingCount} label="Pending" accent="signal" />
            <StatTile
              value={completedCount}
              label="Delivered"
              accent="success"
            />
            <StatTile
              value={failedCount}
              label="Failed"
              accent="destructive"
            />
          </div>
        </div>
      </header>

      {/* Map */}
      {showMap && markers.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="border border-border-strong bg-card overflow-hidden rounded-sm relative">
            <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-signal bg-background/70 backdrop-blur px-2 py-1 border border-signal/40 rounded-[2px] z-10">
              ● {markers.length} stops · live
            </div>
            <HereMap markers={markers} className="h-80" />
          </div>
        </div>
      )}

      {/* Stops list */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-5 pb-20 w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow-signal">§ Stops</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            in sequence
          </span>
        </div>

        <div className="space-y-2.5">
          {orders.map((order) => {
            const status = order.status as
              | "delivered"
              | "failed"
              | "assigned"
              | "in_transit"
            const isDone = status === "delivered" || status === "failed"
            const isFailed = status === "failed"
            const isDelivered = status === "delivered"

            return (
              <Link
                key={order.id}
                href={`/driver/routes/${route.id}/${order.id}`}
              >
                <div
                  className={`group border bg-card hover:bg-surface-2 transition-all duration-200 rounded-sm overflow-hidden relative ${
                    isDelivered
                      ? "border-success/40 opacity-75"
                      : isFailed
                        ? "border-destructive/40 opacity-80"
                        : "border-border hover:border-signal/60"
                  }`}
                >
                  <div className="flex items-stretch">
                    {/* Stop sequence column */}
                    <div
                      className={`flex-shrink-0 w-14 grid place-items-center font-mono text-xl font-semibold border-r ${
                        isDelivered
                          ? "bg-success/15 text-success border-success/30"
                          : isFailed
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : "bg-signal text-signal-foreground border-signal/40"
                      }`}
                    >
                      {order.stop_sequence}
                    </div>

                    {/* Stop body */}
                    <div className="flex-1 min-w-0 p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base tracking-tight truncate">
                            {order.customer_name}
                          </h3>
                          {order.order_number && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              #{order.order_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {order.latitude && order.longitude && (
                            <button
                              type="button"
                              className="size-8 grid place-items-center bg-signal text-signal-foreground hover:bg-signal/90 rounded-[2px]"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.open(
                                  buildNavigationUrl(
                                    order.latitude,
                                    order.longitude,
                                  ),
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }}
                              title="Navigate to stop"
                            >
                              <Navigation
                                className="size-3.5"
                                strokeWidth={2.5}
                              />
                            </button>
                          )}
                          {isDelivered && (
                            <CheckCircle
                              className="size-5 text-success flex-shrink-0"
                              strokeWidth={1.8}
                            />
                          )}
                          {isFailed && (
                            <XCircle
                              className="size-5 text-destructive flex-shrink-0"
                              strokeWidth={1.8}
                            />
                          )}
                          {!isDone && (
                            <Clock
                              className="size-5 text-muted-foreground flex-shrink-0"
                              strokeWidth={1.6}
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground leading-snug mb-1">
                        <MapPin
                          className="size-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/70"
                          strokeWidth={1.5}
                        />
                        <span className="line-clamp-2">{order.address}</span>
                      </div>

                      {order.phone && (
                        <a
                          href={`tel:${order.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-mono text-[12px] tracking-tight text-signal hover:underline underline-offset-2"
                        >
                          <Phone className="size-3" strokeWidth={2} />
                          {order.phone}
                        </a>
                      )}
                    </div>

                    {/* Chevron */}
                    <div className="flex-shrink-0 grid place-items-center px-3 border-l border-border">
                      <ChevronRight
                        className="size-4 text-muted-foreground group-hover:text-signal group-hover:translate-x-0.5 transition-all"
                        strokeWidth={1.6}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer status */}
        <div className="mt-8 border-t border-border pt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="pulse-dot" />
            Streaming GPS · {orders.length} stops loaded
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </main>
    </div>
  )
}

function StatTile({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent: "signal" | "success" | "destructive"
}) {
  const colorClass = {
    signal: "border-signal/40 bg-signal/10",
    success: "border-success/40 bg-success/10",
    destructive: "border-destructive/40 bg-destructive/10",
  }[accent]

  const textClass = {
    signal: "text-signal",
    success: "text-success",
    destructive: "text-destructive",
  }[accent]

  return (
    <div
      className={`border ${colorClass} rounded-sm px-3 py-2 text-center`}
    >
      <div className={`font-mono text-xl font-semibold tracking-tight tabular-nums ${textClass}`}>
        {value}
      </div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  )
}
