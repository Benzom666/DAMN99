import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-medium tracking-tight',
    'rounded-full',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'active:translate-y-[0.5px]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-foreground text-background hover:bg-foreground/90',
        primary:
          'bg-primary text-primary-foreground hover:bg-[var(--color-primary-hover)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-secondary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-surface-3',
        soft:
          'bg-primary-soft text-primary hover:bg-primary-soft/70',
        ghost:
          'text-foreground/80 hover:bg-secondary hover:text-foreground',
        link:
          'text-primary underline-offset-4 hover:underline rounded-none px-0',
      },
      size: {
        default: 'h-10 px-5 has-[>svg]:px-4',
        sm: 'h-9 px-4 has-[>svg]:px-3.5 text-[13px]',
        lg: 'h-12 px-6 has-[>svg]:px-5 text-[15px]',
        xl: 'h-14 px-8 has-[>svg]:px-7 text-base',
        icon: 'size-10',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
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
