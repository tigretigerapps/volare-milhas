import { useState, type FormEvent } from 'react'

import { BarraBusca } from '@/components/BarraBusca'
import { FaixaAlerta } from '@/components/FaixaAlerta'
import { LinhaResultado } from '@/components/LinhaResultado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { alertaExemplo, milheiroExemplo, ofertasExemplo } from '@/data/exemplo'
import { ordenarOfertas, type CriterioOrdenacao } from '@/lib/comparacao'
import { formatarReaisComCentavos } from '@/lib/formato'
import { cn } from '@/lib/utils'

const criterios: { valor: CriterioOrdenacao; rotulo: string }[] = [
  { valor: 'economia', rotulo: 'maior economia' },
  { valor: 'horario', rotulo: 'horário' },
  { valor: 'duracao', rotulo: 'duração' },
]

function MilheiroUsuario({ valor, onAlterar }: { valor: number; onAlterar: (valor: number) => void }) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')

  const abrir = () => {
    setRascunho(valor.toFixed(2).replace('.', ','))
    setEditando(true)
  }

  const salvar = (evento: FormEvent) => {
    evento.preventDefault()
    const numero = Number(rascunho.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(numero) && numero > 0) onAlterar(numero)
    setEditando(false)
  }

  if (editando) {
    return (
      <form onSubmit={salvar} className="flex flex-wrap items-center gap-2">
        <label htmlFor="milheiro" className="text-texto-secundario">
          Seu milheiro: R$
        </label>
        <Input
          id="milheiro"
          inputMode="decimal"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          className="h-9 w-24 tabular-nums"
          autoFocus
        />
        <Button type="submit" size="sm">
          Salvar
        </Button>
        <Button type="button" variant="link" onClick={() => setEditando(false)}>
          Cancelar
        </Button>
      </form>
    )
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-3">
      <span>
        <span className="text-texto-secundario">Seu milheiro: </span>
        <span className="whitespace-nowrap font-normal tabular-nums">{formatarReaisComCentavos(valor)}</span>
      </span>
      <Button variant="link" onClick={abrir}>
        Editar
      </Button>
    </p>
  )
}

export function Buscar() {
  const [milheiro, setMilheiro] = useState(milheiroExemplo)
  const [criterio, setCriterio] = useState<CriterioOrdenacao>('economia')

  const ofertas = ordenarOfertas(ofertasExemplo, criterio, milheiro)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Buscar voos</h1>

      <BarraBusca
        inicial={{ origem: 'GRU', destino: 'SSA', ida: '2026-11-20', volta: '' }}
        // Nesta etapa a busca não consulta nada: os resultados são dados de exemplo fixos.
        onBuscar={() => {}}
      />

      <div className="flex flex-col gap-2 text-sm md:flex-row md:items-baseline md:justify-between">
        <MilheiroUsuario valor={milheiro} onAlterar={setMilheiro} />

        <p className="text-texto-secundario">
          Ordenar por{' '}
          {criterios.map((c, i) => (
            <span key={c.valor}>
              <button
                type="button"
                onClick={() => setCriterio(c.valor)}
                aria-pressed={criterio === c.valor}
                className={cn(
                  'rounded-sm underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  criterio === c.valor
                    ? 'font-medium text-texto'
                    : 'underline decoration-fio hover:text-texto hover:decoration-texto',
                )}
              >
                {c.rotulo}
              </button>
              {i < criterios.length - 2 ? ', ' : i === criterios.length - 2 ? ' ou ' : ''}
            </span>
          ))}
        </p>
      </div>

      <section aria-label="Resultados">
        <ul className="divide-y divide-fio border-y border-fio">
          {ofertas.map((oferta) => (
            <LinhaResultado key={oferta.id} oferta={oferta} milheiro={milheiro} />
          ))}
        </ul>
      </section>

      <FaixaAlerta alerta={alertaExemplo} />
    </div>
  )
}
