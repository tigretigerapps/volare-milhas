import type { ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = ComponentProps<typeof Input> & {
  id: string
  rotulo: string
  ajuda?: string
}

export function CampoTexto({ id, rotulo, ajuda, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input id={id} aria-describedby={ajuda ? `${id}-ajuda` : undefined} {...props} />
      {ajuda && (
        <p id={`${id}-ajuda`} className="text-xs text-texto-secundario">
          {ajuda}
        </p>
      )}
    </div>
  )
}
