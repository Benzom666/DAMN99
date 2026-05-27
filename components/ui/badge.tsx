import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center gap-1',
    'px-2.5 py-0.5 rounded-full',
    'text-[11.5px] font-medium tracking-tight',
    'border w-fit whitespace-nowrap shrink-0',
    '[&>svg]:size-3 [&>svg]:pointer-events-none',
    'transition-colors',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'border-primary/20 bg-primary-soft text-primary',
        secondary:
          'border-border bg-secondary text-foreground',
        destructive:
          'border-destructive/30 bg-destructive-soft text-destructive',
        success:
          'border-success/30 bg-success-soft text-success',
        warning:
          'border-warning/30 bg-warning-soft text-warning',
        info:
          'border-info/30 bg-info-soft text-info',
        outline:
          'border-border bg-transparent text-muted-foreground',
        solid:
          'border-transparent bg-foreground text-background',
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
