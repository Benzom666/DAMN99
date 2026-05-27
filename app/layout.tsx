import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, DM_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Delivery OS — Modern logistics operations for regional carriers",
  description:
    "Delivery OS scales with you from your first delivery to millions daily. Route optimization, live dispatch, proof of delivery, and a unified operator console for last-mile teams.",
  generator: "Delivery OS",
  applicationName: "Delivery OS",
  keywords: [
    "route optimization",
    "delivery management",
    "dispatch software",
    "fleet logistics",
    "proof of delivery",
    "last-mile",
    "regional carrier",
  ],
  authors: [{ name: "Delivery OS" }],
  openGraph: {
    title: "Delivery OS — Modern logistics for the modern regional carrier",
    description:
      "A technology-first approach to last-mile delivery. Built for operators.",
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
      className={`${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
