"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
          ? "#16a34a"
          : o.status === "failed"
            ? "#dc2626"
            : "#5B62F7",
    }))

  const buildNavigationUrl = (lat: number, lng: number) => {
    return `https://www.here.com/directions/drive/${lat},${lng}`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30">
        <div className="px-4 sm:px-6 pt-4 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/driver">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <Badge variant="success" className="mb-1">
                Active route
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {route.name}
              </h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${progress === 100 ? "bg-success" : "bg-primary"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-foreground font-medium">
              {completedCount + failedCount}/{orders.length}
            </span>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={pendingCount} label="Pending" tone="primary" />
            <StatTile value={completedCount} label="Delivered" tone="success" />
            <StatTile
              value={failedCount}
              label="Failed"
              tone="destructive"
            />
          </div>
        </div>
      </header>

      {/* Map */}
      {showMap && markers.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="soft-card overflow-hidden p-1">
            <HereMap markers={markers} className="h-72 rounded-[14px]" />
          </div>
        </div>
      )}

      {/* Stops list */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-5 pb-20 w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="section-eyebrow">Stops</div>
          <span className="text-xs text-muted-foreground">in sequence</span>
        </div>

        <div className="space-y-3">
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
                className={`soft-card group flex items-stretch transition-transform hover:-translate-y-0.5 overflow-hidden ${
                  isDelivered ? "opacity-75" : ""
                }`}
              >
                {/* Stop sequence column */}
                <div
                  className={`flex-shrink-0 w-14 grid place-items-center text-xl font-bold tracking-tight ${
                    isDelivered
                      ? "bg-success-soft text-success"
                      : isFailed
                        ? "bg-destructive-soft text-destructive"
                        : "bg-primary text-primary-foreground"
                  }`}
                >
                  {order.stop_sequence}
                </div>

                {/* Stop body */}
                <div className="flex-1 min-w-0 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base tracking-tight truncate">
                        {order.customer_name}
                      </h3>
                      {order.order_number && (
                        <span className="text-xs text-muted-foreground">
                          #{order.order_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {order.latitude && order.longitude && (
                        <button
                          type="button"
                          className="size-8 grid place-items-center bg-primary text-primary-foreground hover:bg-[var(--color-primary-hover)] rounded-full"
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
                          title="Navigate"
                        >
                          <Navigation
                            className="size-3.5"
                            strokeWidth={2.4}
                          />
                        </button>
                      )}
                      {isDelivered && (
                        <CheckCircle
                          className="size-5 text-success"
                          strokeWidth={1.8}
                        />
                      )}
                      {isFailed && (
                        <XCircle
                          className="size-5 text-destructive"
                          strokeWidth={1.8}
                        />
                      )}
                      {!isDone && (
                        <Clock
                          className="size-5 text-muted-foreground"
                          strokeWidth={1.8}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground leading-snug mb-1.5">
                    <MapPin
                      className="size-3.5 mt-0.5 flex-shrink-0"
                      strokeWidth={1.7}
                    />
                    <span className="line-clamp-2">{order.address}</span>
                  </div>

                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
                    >
                      <Phone className="size-3.5" strokeWidth={1.8} />
                      {order.phone}
                    </a>
                  )}
                </div>

                {/* Chevron */}
                <div className="flex-shrink-0 grid place-items-center px-3 border-l border-border">
                  <ChevronRight
                    className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                    strokeWidth={1.8}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function StatTile({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: "primary" | "success" | "destructive"
}) {
  const map = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    success: { bg: "bg-success-soft", text: "text-success" },
    destructive: { bg: "bg-destructive-soft", text: "text-destructive" },
  }
  const c = map[tone]

  return (
    <div className={`rounded-xl px-3 py-2.5 text-center ${c.bg}`}>
      <div
        className={`text-xl font-bold tracking-tight tabular-nums ${c.text}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}
