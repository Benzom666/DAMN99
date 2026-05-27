import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = "primary" | "white" | "muted"

interface BrandMarkProps {
  tone?: Tone
  /** Tile dimension in pixels (default 32) */
  size?: number
  className?: string
}

/**
 * BrandMark — the icon-only Delivery OS glyph.
 * A small filled tile in soft indigo (or white-on-color for dark surfaces),
 * containing a clean optimized-route motif.
 */
export function BrandMark({
  tone = "primary",
  size = 32,
  className,
}: BrandMarkProps) {
  const tile =
    tone === "white"
      ? "bg-white text-primary"
      : tone === "muted"
        ? "bg-muted text-foreground"
        : "bg-primary text-white"

  return (
    <span
      aria-label="Delivery OS"
      role="img"
      className={cn(
        "inline-grid place-items-center flex-shrink-0 rounded-[22%]",
        tile,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-[72%] h-[72%]"
        aria-hidden="true"
      >
        <circle cx="9" cy="23" r="2.4" fill="currentColor" />
        <path
          d="M 9 23 L 9 13 L 21 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M 19 9.5 L 24 13 L 19 16.5 Z" fill="currentColor" />
      </svg>
    </span>
  )
}

interface BrandLockupProps {
  tone?: Tone
  /** Wordmark size */
  textSize?: "sm" | "md" | "lg"
  className?: string
  /** Icon-only mode */
  iconOnly?: boolean
  /** Override the wordmark color (otherwise inherits from tone) */
  wordmarkClass?: string
}

/**
 * BrandLockup — icon mark + "Delivery OS" wordmark in DM Sans.
 * Minimalist, sentence-cased, no italics, no editorial flourish.
 */
export function BrandLockup({
  tone = "primary",
  textSize = "md",
  className,
  iconOnly = false,
  wordmarkClass,
}: BrandLockupProps) {
  const sizeMap = {
    sm: { tile: 26, text: "text-base" },
    md: { tile: 30, text: "text-lg" },
    lg: { tile: 38, text: "text-xl" },
  }
  const s = sizeMap[textSize]

  // Default wordmark color: dark for primary tile, white for white tile
  const defaultWordmark =
    tone === "white" ? "text-white" : "text-foreground"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 leading-none",
        className,
      )}
    >
      <BrandMark tone={tone} size={s.tile} />
      {!iconOnly && (
        <span
          className={cn(
            s.text,
            "font-semibold tracking-tight",
            wordmarkClass || defaultWordmark,
          )}
        >
          Delivery OS
        </span>
      )}
    </span>
  )
}
