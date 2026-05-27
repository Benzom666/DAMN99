import * as React from "react"
import Link from "next/link"
import { BrandLockup } from "@/components/brand-mark"

interface AuthShellProps {
  /** Sub-headline text on the left panel */
  pitch: string
  /** Big headline on the left panel */
  headline: string
  /** Form area */
  children: React.ReactNode
  /** Optional bottom row under the form */
  footer?: React.ReactNode
}

/**
 * AuthShell — minimalist split layout.
 * Left: soft purple-gradient panel with brand, headline, pitch, mock dashboard card.
 * Right: clean white form panel.
 */
export function AuthShell({
  pitch,
  headline,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-svh bg-background grid lg:grid-cols-[1.05fr_1fr]">
      {/* LEFT — gradient pitch panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 hero-gradient text-white overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center group">
            <BrandLockup tone="white" textSize="md" wordmarkClass="text-white" />
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-[1.15] text-white max-w-md">
            {headline}
          </h2>
          <p className="mt-5 text-base text-white/85 leading-relaxed max-w-md">
            {pitch}
          </p>

          {/* Trust strip */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm">
            {[
              { k: "10K+", v: "Stops daily" },
              { k: "41%", v: "Fuel saved" },
              { k: "99.97%", v: "Uptime" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-bold tracking-tight">{s.k}</div>
                <div className="text-xs text-white/75 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/70">
          © 2026 Delivery OS · all rights reserved
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <main className="relative flex flex-col bg-background">
        {/* Mobile-only top brand */}
        <div className="lg:hidden border-b border-border px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <BrandLockup textSize="sm" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {footer && (
          <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </main>
    </div>
  )
}
