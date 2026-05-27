import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Operational tag, e.g. "OPS-04" or "SECTOR-A" */
  tag?: string
  /** Eyebrow label above title, e.g. "DISPATCH MONITOR" */
  eyebrow?: string
  /** Page title (display) */
  title: string
  /** Optional italic editorial keyword to emphasize inside the title (replaces it) */
  serifEmphasis?: string
  /** Sub-description */
  description?: string
  /** Right-side actions */
  actions?: React.ReactNode
  /** Live status indicator */
  live?: boolean
  className?: string
}

/**
 * PageHeader — terminal-style page header used across admin/super-admin shells.
 * Combines an eyebrow tag, large title (with optional editorial-italic accent),
 * description, and right-aligned action slot. Includes optional live pulse.
 */
export function PageHeader({
  tag,
  eyebrow,
  title,
  serifEmphasis,
  description,
  actions,
  live = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-border bg-background sticky top-0 z-30 backdrop-blur-md bg-background/80',
        className,
      )}
    >
      <div className="px-6 lg:px-10 pt-6 pb-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            {/* Eyebrow row */}
            <div className="flex items-center gap-3 mb-2">
              {tag && (
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-signal border border-signal/40 px-1.5 py-0.5 rounded-[2px]">
                  {tag}
                </span>
              )}
              {eyebrow && (
                <span className="eyebrow">{eyebrow}</span>
              )}
              {live && (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-success">
                  <span className="pulse-dot" />
                  Live
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[2rem] lg:text-[2.4rem] font-semibold tracking-tight leading-[1.05] text-foreground">
              {serifEmphasis ? (
                <>
                  {title}{' '}
                  <span className="font-serif italic text-signal font-normal">
                    {serifEmphasis}
                  </span>
                </>
              ) : (
                title
              )}
            </h1>

            {description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-[58ch] leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </header>
  )
}
