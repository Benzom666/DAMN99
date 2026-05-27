import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = "signal" | "destructive" | "mono"

interface BrandMarkProps {
  /** Visual tone for the icon tile */
  tone?: Tone
  /** Tile dimension in tailwind size units (defaults to 7 = 28px) */
  size?: number
  className?: string
}

/**
 * BrandMark — the icon-only Delivery OS glyph.
 * A small filled tile (cargo-yellow / red / monochrome) containing the
 * optimized-route motif: depot dot, single right-angle bend, arrowhead.
 */
export function BrandMark({
  tone = "signal",
  size = 7,
  className,
}: BrandMarkProps) {
  const tile =
    tone === "signal"
      ? "bg-signal text-signal-foreground"
      : tone === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : "bg-foreground text-background"

  return (
    <span
      aria-label="Delivery OS"
      role="img"
      className={cn(
        "relative inline-flex items-center justify-center rounded-[3px] flex-shrink-0",
        tile,
        className,
      )}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-[78%] h-[78%]"
        aria-hidden="true"
      >
        {/* Depot */}
        <circle cx="8" cy="24" r="2.6" fill="currentColor" />
        {/* Optimized route with single elbow */}
        <path
          d="M 8 24 L 8 12 L 22 12"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        {/* Arrowhead destination */}
        <path d="M 19 8 L 26 12 L 19 16 Z" fill="currentColor" />
      </svg>
    </span>
  )
}

interface BrandLockupProps {
  /** Tile tone */
  tone?: Tone
  /** Pixel font size for the wordmark */
  textSize?: "xs" | "sm" | "md" | "lg"
  /** Force a colour for the wordmark text (defaults to current text color) */
  className?: string
  /** Hide the wordmark and only show the icon mark */
  iconOnly?: boolean
  /** Stack vertically with the wordmark below the icon */
  vertical?: boolean
}

/**
 * BrandLockup — the icon mark + wordmark "Delivery OS".
 * "Delivery" is rendered in editorial Instrument Serif italic, "OS" in
 * monospace uppercase tracking. Composes BrandMark.
 */
export function BrandLockup({
  tone = "signal",
  textSize = "md",
  className,
  iconOnly = false,
  vertical = false,
}: BrandLockupProps) {
  const sizeMap = {
    xs: { tile: 6, serif: "text-base", mono: "text-[10px]" },
    sm: { tile: 7, serif: "text-lg", mono: "text-[11px]" },
    md: { tile: 8, serif: "text-xl", mono: "text-xs" },
    lg: { tile: 10, serif: "text-2xl", mono: "text-sm" },
  }
  const s = sizeMap[textSize]

  const accentClass =
    tone === "destructive" ? "text-destructive" : "text-signal"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 leading-none",
        vertical && "flex-col items-start gap-1.5",
        className,
      )}
    >
      <BrandMark tone={tone} size={s.tile} />
      {!iconOnly && (
        <span className="inline-flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-serif italic tracking-tight text-foreground",
              s.serif,
            )}
          >
            Delivery
          </span>
          <span
            className={cn(
              "font-mono font-bold uppercase tracking-[0.08em]",
              s.mono,
              accentClass,
            )}
          >
            OS
          </span>
        </span>
      )}
    </span>
  )
}
