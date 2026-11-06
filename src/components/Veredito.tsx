import type { Vencedor } from '@/lib/comparacao'
import { formatarMilheiro, formatarReais } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Props = {
  vencedor: Vencedor
  diferenca: number
  milheiro: number
  /** Taxa cobrada pelo programa na emissão (ex.: Azul). Troca o complemento quando existe. */
  taxaResgate?: number
}

export function Veredito({ vencedor, diferenca, milheiro, taxaResgate }: Props) {
  const valor = <span className="whitespace-nowrap">{formatarReais(diferenca)}</span>

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
    ) : taxaResgate ? (
      <>
        inclui <span className="whitespace-nowrap vm-num">{formatarReais(taxaResgate)}</span> de taxa de resgate
      </>
    ) : (
      <>
        com o seu milheiro a <span className="whitespace-nowrap vm-num">{formatarMilheiro(milheiro)}</span>
      </>
    )

  return (
    <div>
      <p
        className={cn(
          'text-[19px] font-semibold leading-6 vm-num md:text-title',
          vencedor === 'milhas' ? 'text-vm-gold-700' : 'text-vm-navy-700',
        )}
      >
        {titulo}
      </p>
      <p className="mt-0.5 text-[13px] leading-[18px] text-vm-ink-muted">{detalhe}</p>
    </div>
  )
}
