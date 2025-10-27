"use client"

import { useEffect, useState } from "react"
import { generateQRCode } from "@/lib/qr-code"

interface ShippingLabelProps {
  order: {
    id: string
    customer_name: string
    address: string
    city?: string
    state?: string
    state_province?: string
    postal_code?: string
    zip?: string
    country?: string
    phone?: string
    stop_sequence?: number
    order_number?: string
  }
  routeName?: string
}

export function ShippingLabel({ order, routeName }: ShippingLabelProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    generateQRCode(order.id).then(setQrCodeUrl)
  }, [order.id])

  const displayOrderNumber = order.order_number || `ORD-${order.id.substring(0, 8).toUpperCase()}`

  const buildFullAddress = () => {
    const parts = []

    // Street address
    if (order.address) {
      parts.push(order.address)
    }

    // City, State Postal
    const cityStateZip = []
    if (order.city) cityStateZip.push(order.city)

    const state = order.state || order.state_province
    if (state) cityStateZip.push(state)

    const postal = order.postal_code || order.zip
    if (postal) cityStateZip.push(postal)

    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(", "))
    }

    // Country
    if (order.country) {
      parts.push(order.country)
    }

    return parts.length > 0 ? parts.join("\n") : "N/A"
  }

  return (
    <div
      className="bg-white text-black p-4 flex flex-col"
      style={{
        width: "4in",
        height: "6in",
        pageBreakAfter: "always",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-3">
        <div className="text-2xl font-bold">DELIVERY LABEL</div>
        <div className="text-xl font-bold mt-1 text-blue-600">Order: {displayOrderNumber}</div>
        {routeName && <div className="text-sm mt-1">Route: {routeName}</div>}
        {order.stop_sequence && <div className="text-lg font-semibold">Stop #{order.stop_sequence}</div>}
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-3">
        {qrCodeUrl && (
          <img src={qrCodeUrl || "/placeholder.svg"} alt="Order QR Code" style={{ width: "150px", height: "150px" }} />
        )}
      </div>

      {/* Order ID */}
      <div className="text-center mb-4 pb-3 border-b border-gray-400">
        <div className="text-xs text-gray-600">Internal ID</div>
        <div className="text-xs font-mono text-gray-500 break-all">{order.id}</div>
      </div>

      {/* Delivery Information */}
      <div className="flex-1">
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">DELIVER TO:</div>
          <div className="text-xl font-bold leading-tight">{order.customer_name}</div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">ADDRESS:</div>
          <div className="text-base leading-snug whitespace-pre-line">{buildFullAddress()}</div>
        </div>

        {order.phone && (
          <div>
            <div className="text-xs text-gray-600 mb-1">PHONE:</div>
            <div className="text-base font-semibold">{order.phone}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center mt-auto pt-2 border-t border-gray-300">
        Scan QR code to view order details
      </div>
    </div>
  )
}
