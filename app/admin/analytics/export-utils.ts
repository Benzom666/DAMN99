export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export")
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle values that contain commas or quotes
          if (value === null || value === undefined) return ""
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(","),
    ),
  ].join("\n")

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateDailyLogFile(data: {
  orders: any[]
  routes: any[]
  pods: any[]
  podEmails: any[]
  drivers: any[]
  stopEvents: any[]
}): string {
  const { orders, routes, pods, podEmails, drivers, stopEvents } = data
  const date = new Date().toISOString().split("T")[0]

  let log = `DAILY DELIVERY LOG - ${date}\n`
  log += `${"=".repeat(80)}\n\n`

  // Summary Section
  log += `SUMMARY\n`
  log += `${"-".repeat(80)}\n`
  log += `Total Orders: ${orders.length}\n`
  log += `  - Delivered: ${orders.filter((o) => o.status === "delivered").length}\n`
  log += `  - Failed: ${orders.filter((o) => o.status === "failed").length}\n`
  log += `  - Pending: ${orders.filter((o) => o.status === "pending" || o.status === "assigned").length}\n`
  log += `\n`
  log += `Total Routes: ${routes.length}\n`
  log += `  - Active: ${routes.filter((r) => r.status === "active").length}\n`
  log += `  - Completed: ${routes.filter((r) => r.status === "completed").length}\n`
  log += `\n`
  log += `Active Drivers: ${drivers.length}\n`
  log += `Total PODs Captured: ${pods.length}\n`
  log += `  - With Photos: ${pods.filter((p) => p.photo_url).length}\n`
  log += `  - With Signatures: ${pods.filter((p) => p.signature_url).length}\n`
  log += `Emails Sent: ${podEmails.length}\n`
  log += `\n\n`

  // Route Details
  log += `ROUTE DETAILS\n`
  log += `${"-".repeat(80)}\n`
  routes.forEach((route) => {
    const routeOrders = orders.filter((o) => o.route_id === route.id)
    const delivered = routeOrders.filter((o) => o.status === "delivered").length
    const failed = routeOrders.filter((o) => o.status === "failed").length

    log += `\nRoute: ${route.name}\n`
    log += `  Driver: ${route.driver?.display_name || route.driver?.email || "Unassigned"}\n`
    log += `  Status: ${route.status}\n`
    log += `  Total Stops: ${routeOrders.length}\n`
    log += `  Delivered: ${delivered}\n`
    log += `  Failed: ${failed}\n`
    log += `  Pending: ${routeOrders.length - delivered - failed}\n`

    if (route.distance_km) {
      log += `  Distance: ${route.distance_km.toFixed(2)} km\n`
    }
    if (route.duration_sec) {
      const hours = Math.floor(route.duration_sec / 3600)
      const minutes = Math.floor((route.duration_sec % 3600) / 60)
      log += `  Duration: ${hours}h ${minutes}m\n`
    }

    log += `  Created: ${new Date(route.created_at).toLocaleString()}\n`
  })
  log += `\n\n`

  // Driver Performance
  log += `DRIVER PERFORMANCE\n`
  log += `${"-".repeat(80)}\n`
  drivers.forEach((driver) => {
    const driverRoutes = routes.filter((r) => r.driver_id === driver.id)
    const driverOrders = orders.filter((o) => o.route?.driver_id === driver.id)
    const driverPODs = pods.filter((p) => p.driver_id === driver.id)

    log += `\nDriver: ${driver.display_name || driver.email}\n`
    log += `  Routes Assigned: ${driverRoutes.length}\n`
    log += `  Deliveries: ${driverOrders.filter((o) => o.status === "delivered").length}\n`
    log += `  Failed: ${driverOrders.filter((o) => o.status === "failed").length}\n`
    log += `  PODs Captured: ${driverPODs.length}\n`
    log += `  Photo Capture Rate: ${driverPODs.length > 0 ? Math.round((driverPODs.filter((p) => p.photo_url).length / driverPODs.length) * 100) : 0}%\n`
    log += `  Signature Capture Rate: ${driverPODs.length > 0 ? Math.round((driverPODs.filter((p) => p.signature_url).length / driverPODs.length) * 100) : 0}%\n`
  })
  log += `\n\n`

  // Delivery Details
  log += `DELIVERY DETAILS\n`
  log += `${"-".repeat(80)}\n`
  const deliveredOrders = orders.filter((o) => o.status === "delivered")
  deliveredOrders.forEach((order) => {
    const pod = pods.find((p) => p.order_id === order.id)

    log += `\nOrder: ${order.order_number || order.id.substring(0, 8)}\n`
    log += `  Customer: ${order.customer_name}\n`
    log += `  Address: ${order.address}\n`
    log += `  Route: ${order.route?.name || "N/A"}\n`
    log += `  Driver: ${order.route?.driver?.display_name || order.route?.driver?.email || "N/A"}\n`
    log += `  Created: ${new Date(order.created_at).toLocaleString()}\n`

    if (pod) {
      log += `  Delivered: ${new Date(pod.delivered_at).toLocaleString()}\n`

      // Calculate delivery time
      const created = new Date(order.created_at).getTime()
      const delivered = new Date(pod.delivered_at).getTime()
      const durationMinutes = Math.round((delivered - created) / 1000 / 60)
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      log += `  Delivery Time: ${hours}h ${minutes}m\n`

      log += `  Photo: ${pod.photo_url ? "Yes" : "No"}\n`
      log += `  Signature: ${pod.signature_url ? "Yes" : "No"}\n`
      if (pod.recipient_name) {
        log += `  Recipient: ${pod.recipient_name}\n`
      }
      if (pod.notes) {
        log += `  Notes: ${pod.notes}\n`
      }
    }
  })
  log += `\n\n`

  // Failed Deliveries
  const failedOrders = orders.filter((o) => o.status === "failed")
  if (failedOrders.length > 0) {
    log += `FAILED DELIVERIES\n`
    log += `${"-".repeat(80)}\n`
    failedOrders.forEach((order) => {
      const failEvent = stopEvents.find((e) => e.order_id === order.id && e.event_type === "failed")

      log += `\nOrder: ${order.order_number || order.id.substring(0, 8)}\n`
      log += `  Customer: ${order.customer_name}\n`
      log += `  Address: ${order.address}\n`
      log += `  Route: ${order.route?.name || "N/A"}\n`
      log += `  Driver: ${order.route?.driver?.display_name || order.route?.driver?.email || "N/A"}\n`
      if (failEvent?.notes) {
        log += `  Reason: ${failEvent.notes}\n`
      }
      if (failEvent?.created_at) {
        log += `  Failed At: ${new Date(failEvent.created_at).toLocaleString()}\n`
      }
    })
    log += `\n\n`
  }

  // Footer
  log += `${"-".repeat(80)}\n`
  log += `Report Generated: ${new Date().toLocaleString()}\n`
  log += `End of Daily Log\n`

  return log
}
