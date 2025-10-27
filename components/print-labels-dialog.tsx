"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { ShippingLabel } from "./shipping-label"
import { useState } from "react"

interface PrintLabelsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: any[]
  routeName?: string
}

export function PrintLabelsDialog({ open, onOpenChange, orders, routeName }: PrintLabelsDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = async () => {
    setIsPrinting(true)

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank", "width=800,height=600")

      if (!printWindow) {
        alert("Please allow pop-ups to print labels")
        setIsPrinting(false)
        return
      }

      // Build the HTML content with all labels
      const labelsHTML = await Promise.all(
        orders.map(async (order) => {
          // Generate QR code for each order
          const qrModule = await import("@/lib/qr-code")
          const qrCodeUrl = await qrModule.generateQRCode(order.id)

          const displayOrderNumber = order.order_number || `ORD-${order.id.substring(0, 8).toUpperCase()}`

          const buildFullAddress = () => {
            const parts = []

            if (order.address) parts.push(order.address)

            const cityStateZip = []
            if (order.city) cityStateZip.push(order.city)
            if (order.state || order.state_province) cityStateZip.push(order.state || order.state_province)
            if (order.postal_code || order.zip) cityStateZip.push(order.postal_code || order.zip)

            if (cityStateZip.length > 0) parts.push(cityStateZip.join(", "))
            if (order.country) parts.push(order.country)

            return parts.length > 0 ? parts.join("<br>") : "N/A"
          }

          return `
            <div class="label-page">
              <div class="label-content">
                <!-- Header -->
                <div class="label-header">
                  <div class="label-title">DELIVERY LABEL</div>
                  <div class="label-order-number">Order: ${displayOrderNumber}</div>
                  ${routeName ? `<div class="label-route">Route: ${routeName}</div>` : ""}
                  ${order.stop_sequence ? `<div class="label-stop">Stop #${order.stop_sequence}</div>` : ""}
                </div>

                <!-- QR Code -->
                <div class="label-qr">
                  <img src="${qrCodeUrl}" alt="Order QR Code" />
                </div>

                <!-- Order ID -->
                <div class="label-order-id">
                  <div class="label-small-text">Internal ID</div>
                  <div class="label-id-value">${order.id}</div>
                </div>

                <!-- Delivery Information -->
                <div class="label-info">
                  <div class="label-section">
                    <div class="label-small-text">DELIVER TO:</div>
                    <div class="label-customer">${order.customer_name || "N/A"}</div>
                  </div>

                  <div class="label-section">
                    <div class="label-small-text">ADDRESS:</div>
                    <div class="label-address">${buildFullAddress()}</div>
                  </div>

                  ${
                    order.phone
                      ? `
                    <div class="label-section">
                      <div class="label-small-text">PHONE:</div>
                      <div class="label-phone">${order.phone}</div>
                    </div>
                  `
                      : ""
                  }
                </div>

                <!-- Footer -->
                <div class="label-footer">
                  Scan QR code to view order details
                </div>
              </div>
            </div>
          `
        }),
      )

      // Write the complete HTML document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Labels</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: Arial, sans-serif;
                background: white;
              }

              .label-page {
                width: 4in;
                height: 6in;
                page-break-after: always;
                page-break-inside: avoid;
                position: relative;
                background: white;
                padding: 0.25in;
              }

              .label-page:last-child {
                page-break-after: auto;
              }

              .label-content {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                color: black;
              }

              .label-header {
                border-bottom: 2px solid black;
                padding-bottom: 8px;
                margin-bottom: 12px;
              }

              .label-title {
                font-size: 24px;
                font-weight: bold;
              }

              /* Added styling for order number */
              .label-order-number {
                font-size: 20px;
                font-weight: bold;
                color: #2563eb;
                margin-top: 4px;
              }

              .label-route {
                font-size: 12px;
                margin-top: 4px;
              }

              .label-stop {
                font-size: 18px;
                font-weight: 600;
              }

              .label-qr {
                display: flex;
                justify-content: center;
                margin-bottom: 12px;
              }

              .label-qr img {
                width: 150px;
                height: 150px;
              }

              .label-order-id {
                text-align: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #999;
              }

              .label-small-text {
                font-size: 10px;
                color: #666;
                margin-bottom: 4px;
              }

              .label-id-value {
                font-size: 10px;
                font-family: monospace;
                color: #999;
                word-break: break-all;
              }

              .label-info {
                flex: 1;
              }

              .label-section {
                margin-bottom: 12px;
              }

              .label-customer {
                font-size: 20px;
                font-weight: bold;
                line-height: 1.2;
              }

              .label-address {
                font-size: 14px;
                line-height: 1.4;
              }

              .label-phone {
                font-size: 14px;
                font-weight: 600;
              }

              .label-footer {
                font-size: 10px;
                color: #666;
                text-align: center;
                margin-top: auto;
                padding-top: 8px;
                border-top: 1px solid #ccc;
              }

              @page {
                size: 4in 6in;
                margin: 0;
              }

              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }

                .label-page {
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${labelsHTML.join("")}
          </body>
        </html>
      `)

      printWindow.document.close()

      // Wait for images to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
          setIsPrinting(false)
        }, 500)
      }
    } catch (error) {
      console.error("Print error:", error)
      alert("Failed to print labels. Please try again.")
      setIsPrinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Shipping Labels</DialogTitle>
          <DialogDescription>
            Preview and print labels for {orders.length} order{orders.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={handlePrint} className="w-full" disabled={isPrinting}>
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? "Preparing..." : "Print All Labels"}
          </Button>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-muted-foreground mb-4">Preview:</div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="border-2 border-dashed border-gray-300 inline-block">
                  <ShippingLabel order={order} routeName={routeName} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
