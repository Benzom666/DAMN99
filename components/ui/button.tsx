import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-medium tracking-wide',
    'transition-[transform,background-color,border-color,color,box-shadow] duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    'outline-none focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    'rounded-sm',
    'active:translate-y-[0.5px]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-signal text-signal-foreground hover:bg-signal/90 font-semibold uppercase tracking-[0.08em] text-xs',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold uppercase tracking-[0.08em] text-xs',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-surface-2 hover:border-foreground/30 uppercase tracking-[0.08em] text-xs font-semibold',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-surface-3 border border-border uppercase tracking-[0.08em] text-xs font-semibold',
        ghost:
          'hover:bg-surface-2 hover:text-foreground text-muted-foreground uppercase tracking-[0.08em] text-xs font-semibold',
        link: 'text-signal underline-offset-4 hover:underline font-mono uppercase tracking-[0.1em] text-xs',
        signal:
          'bg-signal text-signal-foreground hover:bg-signal/90 font-bold uppercase tracking-[0.1em] text-xs shadow-[0_0_0_1px_oklch(0.12_0.01_80)] hover:shadow-[0_0_0_1px_oklch(0.12_0.01_80),0_0_24px_-4px_oklch(0.92_0.19_100/0.4)]',
      },
      size: {
        default: 'h-9 px-4 has-[>svg]:px-3',
        sm: 'h-8 px-3 has-[>svg]:px-2.5 text-[11px]',
        lg: 'h-11 px-6 has-[>svg]:px-5 text-[13px]',
        xl: 'h-14 px-8 has-[>svg]:px-7 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
