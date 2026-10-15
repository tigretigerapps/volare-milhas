import type { Vencedor } from '@/lib/comparacao'
import { formatarMilheiro, formatarReais } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Props = {
  vencedor: Vencedor
  diferenca: number
  milheiro: number
}

export function Veredito({ vencedor, diferenca, milheiro }: Props) {
  const valor = <span className="whitespace-nowrap tabular-nums">{formatarReais(diferenca)}</span>

  const titulo =
    vencedor === 'milhas' ? (
      <>Milhas economizam {valor}</>
    ) : vencedor === 'dinheiro' ? (
      <>Dinheiro sai {valor} mais barato</>
    ) : (
      <>Milhas e dinheiro saem pelo mesmo preço</>
    )

  const detalhe =
    vencedor === 'dinheiro' ? (
      'guarde suas milhas'
    ) : (
      <>
        com o seu milheiro a <span className="whitespace-nowrap tabular-nums">{formatarMilheiro(milheiro)}</span>
      </>
    )

  return (
    <div>
      <p
        className={cn(
          'font-display text-lg font-medium leading-snug',
          vencedor === 'milhas' ? 'text-economia-texto' : 'text-texto',
        )}
      >
        {titulo}
      </p>
      <p className="mt-0.5 text-sm text-texto-secundario">{detalhe}</p>
    </div>
  )
}
