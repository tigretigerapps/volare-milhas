import { Button } from '@/components/ui/button'
import type { Oferta } from '@/data/exemplo'
import { compararOferta } from '@/lib/comparacao'
import { formatarDuracao, formatarParadas } from '@/lib/formato'
import { Regua } from './Regua'
import { Veredito } from './Veredito'

type Props = {
  oferta: Oferta
  milheiro: number
}

export function LinhaResultado({ oferta, milheiro }: Props) {
  const comparacao = compararOferta(oferta, milheiro)

  return (
    <li className="grid gap-4 py-5 md:grid-cols-[13rem_minmax(0,1fr)_17rem] md:items-center md:gap-8">
      <div>
        <p className="font-display text-3xl font-light leading-tight tabular-nums">
          {oferta.partida} – {oferta.chegada}
        </p>
        <p className="mt-1 text-sm text-texto-secundario">
          {oferta.origem} para {oferta.destino}, {formatarParadas(oferta.paradas)},{' '}
          <span className="tabular-nums">{formatarDuracao(oferta.duracaoMinutos)}</span>
        </p>
        <p className="text-sm text-texto-secundario">
          {oferta.programa}, voo {oferta.voo}
        </p>
      </div>

      <Regua
        dinheiro={oferta.dinheiro}
        milhas={oferta.milhas}
        taxas={oferta.taxas}
        larguraDinheiro={comparacao.larguraDinheiro}
        larguraMilhas={comparacao.larguraMilhas}
        milhasCompensam={comparacao.vencedor === 'milhas'}
      />

      <div className="flex flex-col items-start gap-3">
        <Veredito vencedor={comparacao.vencedor} diferenca={comparacao.diferencaArredondada} milheiro={milheiro} />
        <Button variant="contorno" size="sm">
          Quero essa oferta
        </Button>
      </div>
    </li>
  )
}
