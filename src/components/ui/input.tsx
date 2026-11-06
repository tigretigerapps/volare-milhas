import * as React from 'react'

import { cn } from '@/lib/utils'

/** Campo do design Volo: 48px, borda border-control, foco navy-700 com borda dupla, erro em bordô. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full min-w-0 rounded-vm-sm border border-vm-border-control bg-vm-surface-card px-4 text-base text-vm-navy-700 placeholder:text-vm-ink-muted focus-visible:border-vm-navy-700 focus-visible:shadow-[0_0_0_1px_var(--vm-navy-700)] focus-visible:outline-none aria-[invalid=true]:border-vm-burgundy-600 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
