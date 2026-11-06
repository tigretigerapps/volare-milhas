import * as React from 'react'

import { cn } from '@/lib/utils'

/** Rótulo acima do campo: 13px/500 em ink-muted. Nunca substitua por placeholder. */
const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<'label'>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('text-label text-vm-ink-muted', className)} {...props} />
  ),
)
Label.displayName = 'Label'

export { Label }
