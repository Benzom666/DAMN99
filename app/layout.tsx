import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Delivery OS — Dispatch Terminal for Logistics Operators",
  description:
    "Run the route. Make the drop. Ship the day. Production-grade route optimization, live dispatch, and proof of delivery for fleets that can't afford to break.",
  generator: "Delivery OS",
  applicationName: "Delivery OS",
  keywords: [
    "route optimization",
    "delivery management",
    "dispatch software",
    "fleet logistics",
    "proof of delivery",
    "last-mile",
  ],
  authors: [{ name: "Delivery OS" }],
  openGraph: {
    title: "Delivery OS — Dispatch Terminal for Logistics Operators",
    description:
      "Routes that don't break under pressure. 10,000 packages, optimized, dispatched, delivered.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground selection:bg-signal selection:text-signal-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
