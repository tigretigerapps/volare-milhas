import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { detalheAlerta, type AlertaPrecoAlvo } from '@/lib/alertas'

type Props = {
  alerta: AlertaPrecoAlvo
}

export function FaixaAlerta({ alerta }: Props) {
  const detalhe = detalheAlerta(alerta)

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
          {detalhe && <p className="text-sm text-texto-secundario tabular-nums">{detalhe}</p>}
        </div>
      </div>
      <Button variant="contorno" size="sm" asChild className="self-start md:self-auto">
        <Link to="/rotas">Ver rota</Link>
      </Button>
    </aside>
  )
}
