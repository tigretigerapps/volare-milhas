import type { Vencedor } from '@/lib/comparacao'
import { formatarMilhas, formatarReais } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Props = {
  dinheiro: number
  milhas: number
  taxas: number
  /** Larguras de 0 a 100, já na mesma escala (a maior é 100). */
  larguraDinheiro: number
  larguraMilhas: number
  vencedor: Vencedor
  diferenca: number
  /** "mi" ou "pts" (Azul). */
  unidade?: 'mi' | 'pts'
}

/** Espaço reservado ao rótulo ("18.500 pts + R$ 140"): a barra de 100% ocupa o resto da linha. */
const espacoRotulo = '9.5rem'

function Linha({ largura, rotulo, className }: { largura: number; rotulo: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        aria-hidden
        className={cn('h-2.5 flex-none origin-left rounded-[2px] motion-safe:animate-crescer', className)}
        style={{ width: `calc((100% - ${espacoRotulo}) * ${largura / 100})` }}
      />
      <span aria-hidden className="whitespace-nowrap text-[13px] text-vm-ink-muted vm-num">
        {rotulo}
      </span>
    </div>
  )
}

function fraseVeredito(vencedor: Vencedor, diferenca: number) {
  if (vencedor === 'milhas') return `milhas economizam ${formatarReais(diferenca)}`
  if (vencedor === 'dinheiro') return `dinheiro sai ${formatarReais(diferenca)} mais barato`
  return 'milhas e dinheiro saem pelo mesmo preço'
}

/**
 * A régua: dinheiro em cima, milhas embaixo, os dois em reais na mesma escala.
 * As barras são decorativas; a frase completa vai no aria-label.
 */
export function Regua({
  dinheiro,
  milhas,
  taxas,
  larguraDinheiro,
  larguraMilhas,
  vencedor,
  diferenca,
  unidade = 'mi',
}: Props) {
  const rotuloMilhas = `${formatarMilhas(milhas)} ${unidade} + ${formatarReais(taxas)}`
  const descricao = `Dinheiro ${formatarReais(dinheiro)}, ${unidade === 'pts' ? 'pontos' : 'milhas'} ${formatarMilhas(milhas)} mais ${formatarReais(taxas)}, ${fraseVeredito(vencedor, diferenca)}`

  return (
    <div role="img" aria-label={descricao} className="flex min-w-0 flex-col gap-2">
      <Linha largura={larguraDinheiro} rotulo={formatarReais(dinheiro)} className="bg-vm-bar-dinheiro" />
      <Linha
        largura={larguraMilhas}
        rotulo={rotuloMilhas}
        className={cn('bg-vm-gold-500', vencedor !== 'milhas' && 'opacity-40')}
      />
    </div>
  )
}
