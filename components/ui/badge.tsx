import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    'px-2 py-0.5 rounded-[2px]',
    'font-mono text-[10px] font-semibold uppercase tracking-[0.1em]',
    'border w-fit whitespace-nowrap shrink-0',
    '[&>svg]:size-3 [&>svg]:pointer-events-none',
    'transition-colors',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'border-signal/40 bg-signal/15 text-signal',
        secondary:
          'border-border bg-surface-2 text-foreground',
        destructive:
          'border-destructive/50 bg-destructive/15 text-destructive',
        success:
          'border-success/40 bg-success/15 text-success',
        warning:
          'border-warning/40 bg-warning/15 text-warning',
        info:
          'border-info/40 bg-info/15 text-info',
        outline:
          'border-border-strong bg-transparent text-muted-foreground',
        signal:
          'border-signal/60 bg-signal text-signal-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
