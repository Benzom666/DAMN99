import * as React from "react"
import Link from "next/link"

interface AuthShellProps {
  /** Operational tag, e.g. "OPS-LOGIN" */
  tag: string
  /** Eyebrow above the editorial title */
  eyebrow: string
  /** Big editorial italic phrase rendered on the left panel */
  serifLine: string
  /** Plain prose subline */
  subtitle: string
  /** The form/content (right panel) */
  children: React.ReactNode
  /** Optional bottom secondary CTA (right panel) */
  footer?: React.ReactNode
}

/**
 * AuthShell — full-bleed dispatch-terminal auth layout.
 * Left: editorial serif statement + live console-style status.
 * Right: form area on warm-asphalt background.
 */
export function AuthShell({
  tag,
  eyebrow,
  serifLine,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-svh bg-background grid lg:grid-cols-[1.1fr_1fr] relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.18]" />

      {/* LEFT — editorial panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-border bg-sidebar overflow-hidden">
        <div className="absolute inset-0 bg-grid-paper opacity-50" />
        <div className="absolute top-0 left-0 right-0 h-2 hazard-stripe opacity-90" />

        <div className="relative">
          {/* Top brand */}
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="size-8 grid place-items-center bg-signal text-signal-foreground font-mono text-xs font-bold tracking-tight">
              99
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-sm font-semibold tracking-[0.18em] text-foreground">
                DAMN
              </span>
              <span className="font-serif italic text-sm text-signal">
                ninety-nine
              </span>
            </div>
          </Link>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-signal border border-signal/40 px-2 py-1 rounded-[2px]">
              {tag}
            </span>
            <span className="hairline flex-1 max-w-20" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              {eyebrow}
            </span>
          </div>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-[0.95] tracking-[-0.025em] text-foreground">
            <span className="font-serif italic font-normal text-signal">
              {serifLine}
            </span>
          </h2>
          <p className="mt-6 text-base lg:text-lg text-muted-foreground leading-relaxed max-w-md">
            {subtitle}
          </p>
        </div>

        {/* Status footer */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-6 max-w-md mb-6">
            {[
              { k: "10K+", v: "Stops/day" },
              { k: "41%", v: "Fuel saved" },
              { k: "99.97%", v: "Uptime" },
            ].map((s, i) => (
              <div key={i} className="border-l border-border pl-3">
                <div className="font-mono text-lg font-semibold tracking-tight">
                  {s.k}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="pulse-dot" />
            <span>All systems operational</span>
            <span className="text-border">◆</span>
            <span>SOC2 in progress</span>
          </div>
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <main className="relative flex flex-col">
        {/* Mobile-only top brand */}
        <div className="lg:hidden border-b border-border px-6 py-4 flex items-center justify-between bg-sidebar">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-7 grid place-items-center bg-signal text-signal-foreground font-mono text-[11px] font-bold">
              99
            </div>
            <span className="font-mono text-xs font-semibold tracking-[0.18em]">
              DAMN<span className="font-serif italic text-signal ml-1">ninety-nine</span>
            </span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
            {tag}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {footer && (
          <div className="border-t border-border px-6 py-4 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground bg-surface">
            {footer}
          </div>
        )}
      </main>
    </div>
  )
}
