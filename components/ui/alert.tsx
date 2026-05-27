import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  [
    'relative w-full rounded-xl px-4 py-3 text-sm',
    'border',
    'grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr]',
    'has-[>svg]:gap-x-3 gap-y-1 items-start',
    '[&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-card border-border text-foreground',
        destructive: 'bg-destructive-soft border-destructive/30 text-destructive',
        warning: 'bg-warning-soft border-warning/30 text-warning',
        success: 'bg-success-soft border-success/30 text-success',
        info: 'bg-info-soft border-info/30 text-info',
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
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
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
