import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/60',
        'h-11 w-full min-w-0 px-4 py-2 text-sm',
        'bg-white border border-border rounded-xl',
        'transition-[color,border-color,background-color,box-shadow] duration-150',
        'outline-none',
        'focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15',
        'hover:border-border-strong',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
        'aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
