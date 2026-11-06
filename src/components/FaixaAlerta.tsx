import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { detalheAlerta, type AlertaPrecoAlvo } from '@/lib/alertas'

type Props = {
  alerta: AlertaPrecoAlvo
}

/** Aviso de rota que chegou ao preço-alvo. */
export function FaixaAlerta({ alerta }: Props) {
  const detalhe = detalheAlerta(alerta)

  return (
    <aside
      aria-label="Alerta de preço-alvo"
      className="flex items-start gap-3 rounded-vm-md bg-vm-surface-card px-4 py-3.5 text-sm md:items-center md:px-6"
    >
      <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-vm-burgundy-600 md:mt-0" aria-hidden />
      <div role="status" className="min-w-0 flex-1">
        <p>
          <span className="font-semibold">
            {alerta.origem} para {alerta.destino} chegou ao seu preço-alvo.
          </span>
          {detalhe && <span className="text-vm-ink-muted vm-num"> {detalhe}</span>}
        </p>
        <Link
          to="/rotas"
          className="mt-1 inline-flex min-h-11 items-center font-medium text-vm-gold-700 underline underline-offset-[3px] hover:text-vm-navy-700 md:hidden"
        >
          Ver rota
        </Link>
      </div>
      <Button variant="contorno" size="sm" asChild className="hidden flex-none md:inline-flex">
        <Link to="/rotas">Ver rota</Link>
      </Button>
    </aside>
  )
}
