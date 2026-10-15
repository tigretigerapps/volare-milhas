import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import type { AlertaPrecoAlvo } from '@/data/exemplo'
import { formatarMilhas } from '@/lib/formato'

type Props = {
  alerta: AlertaPrecoAlvo
}

export function FaixaAlerta({ alerta }: Props) {
  return (
    <aside
      className="flex flex-col gap-3 rounded-md border border-fio bg-superficie p-4 md:flex-row md:items-center md:justify-between md:gap-6"
      aria-label="Alerta de preço-alvo"
    >
      <div className="flex gap-3">
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-alerta" aria-hidden />
        <div>
          <p className="font-normal">
            {alerta.origem} para {alerta.destino} chegou ao seu <span className="whitespace-nowrap">preço-alvo.</span>
          </p>
          <p className="text-sm text-texto-secundario tabular-nums">
            {formatarMilhas(alerta.milhas)} milhas na {alerta.programa}, sua meta era {formatarMilhas(alerta.meta)}.
          </p>
        </div>
      </div>
      <Button variant="contorno" size="sm" asChild className="self-start md:self-auto">
        <Link to="/rotas">Ver rota</Link>
      </Button>
    </aside>
  )
}
