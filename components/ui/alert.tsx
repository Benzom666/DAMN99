import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  [
    'relative w-full rounded-sm px-4 py-3 text-sm',
    'border-l-4 border border-border',
    'grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr]',
    'has-[>svg]:gap-x-3 gap-y-1 items-start',
    '[&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-surface text-card-foreground border-l-signal',
        destructive:
          'text-destructive bg-destructive-soft border-l-destructive border-destructive/30',
        warning:
          'text-warning bg-warning-soft border-l-warning border-warning/30',
        success:
          'text-success bg-success-soft border-l-success border-success/30',
        info:
          'text-info bg-info-soft border-l-info border-info/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-mono text-[11px] uppercase tracking-[0.12em]',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm leading-relaxed [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
