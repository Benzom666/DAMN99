import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/60',
        'h-11 w-full min-w-0 px-3 py-2 text-sm',
        'bg-surface border border-border rounded-sm',
        'transition-[color,border-color,background-color,box-shadow] duration-150',
        'outline-none',
        'focus-visible:border-signal focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-signal/30',
        'hover:border-border-strong',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
