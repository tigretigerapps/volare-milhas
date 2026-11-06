import type { ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = ComponentProps<typeof Input> & {
  id: string
  rotulo: string
  ajuda?: string
  /** Mensagem de erro em bordô abaixo do campo, dizendo o que fazer. */
  erro?: string | null
}

export function CampoTexto({ id, rotulo, ajuda, erro, ...props }: Props) {
  const descricao = [erro ? `${id}-erro` : null, ajuda ? `${id}-ajuda` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input id={id} aria-invalid={erro ? true : undefined} aria-describedby={descricao} {...props} />
      {erro && (
        <p id={`${id}-erro`} className="text-[13px] leading-[18px] text-vm-burgundy-600">
          {erro}
        </p>
      )}
      {ajuda && (
        <p id={`${id}-ajuda`} className="text-[13px] leading-[18px] text-vm-ink-muted">
          {ajuda}
        </p>
      )}
    </div>
  )
}
