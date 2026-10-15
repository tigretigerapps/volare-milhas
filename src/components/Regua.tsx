import { formatarMilhas, formatarReais } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Props = {
  dinheiro: number
  milhas: number
  taxas: number
  /** Larguras de 0 a 100, já na mesma escala (a maior é 100). */
  larguraDinheiro: number
  larguraMilhas: number
  milhasCompensam: boolean
}

function Barra({ largura, className }: { largura: number; className: string }) {
  return (
    <div className="h-2.5 min-w-0">
      <div
        className={cn('h-full origin-left rounded-sm motion-safe:animate-crescer', className)}
        style={{ width: `${largura}%` }}
      />
    </div>
  )
}

/**
 * A régua: dinheiro em cima, milhas embaixo, ambos em reais na mesma escala.
 * No desktop os rótulos ficam numa coluna de largura fixa à direita, para as duas barras
 * terem a mesma largura útil. No mobile o rótulo sobe e a barra usa a largura toda.
 */
export function Regua({ dinheiro, milhas, taxas, larguraDinheiro, larguraMilhas, milhasCompensam }: Props) {
  const linha = 'flex flex-col-reverse gap-1 md:grid md:grid-cols-[minmax(0,1fr)_9.5rem] md:items-center md:gap-3'

  return (
    <div className="flex flex-col gap-2.5 text-sm tabular-nums">
      <div className={linha}>
        <Barra largura={larguraDinheiro} className="bg-dinheiro" />
        <span className="whitespace-nowrap text-texto-secundario">
          <span className="sr-only">Em dinheiro: </span>
          {formatarReais(dinheiro)}
        </span>
      </div>

      <div className={linha}>
        <Barra largura={larguraMilhas} className={cn('bg-economia', !milhasCompensam && 'opacity-40')} />
        <span className="whitespace-nowrap text-texto">
          <span className="sr-only">Com milhas: </span>
          {formatarMilhas(milhas)} mi + {formatarReais(taxas)}
        </span>
      </div>
    </div>
  )
}
