import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Small primary-coloured eyebrow above the title */
  eyebrow?: string
  /** Page title */
  title: string
  /** Sub-description (1–2 lines) */
  description?: string
  /** Right-side actions slot */
  actions?: React.ReactNode
  className?: string
}

/**
 * PageHeader — clean, minimalist page header used across admin and
 * super-admin shells. eyebrow + h1 + description, with optional right-aligned
 * actions. Sticky to the top of the main content area.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-border bg-background/85 backdrop-blur-md sticky top-0 z-30',
        className,
      )}
    >
      <div className="px-6 lg:px-10 pt-7 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
            <h1 className="text-2xl lg:text-[1.75rem] font-bold tracking-tight leading-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[64ch] leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
