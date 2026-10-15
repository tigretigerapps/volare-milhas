import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { descreverAlvo, descreverCompanhias, formatarPeriodo, type Rota } from '@/lib/rotas'
import { cn } from '@/lib/utils'

type Props = {
  rota: Rota
  onEditar: () => void
  onAlternarAtivo: () => Promise<{ erro: string | null }>
  onExcluir: () => Promise<{ erro: string | null }>
}

export function LinhaRota({ rota, onEditar, onAlternarAtivo, onExcluir }: Props) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const executar = async (acao: () => Promise<{ erro: string | null }>) => {
    setOcupado(true)
    const { erro } = await acao()
    setOcupado(false)
    setErro(erro)
  }

  return (
    <li className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8">
      <div className={cn(!rota.ativo && 'opacity-60')}>
        <p className="font-display text-2xl font-light leading-tight">
          {rota.origem} para {rota.destino}
        </p>
        <p className="mt-1 text-sm tabular-nums">
          {descreverAlvo(rota)}
          {!rota.ativo && <span className="text-texto-secundario">, pausada</span>}
        </p>
        <p className="text-sm text-texto-secundario">
          {formatarPeriodo(rota.data_inicio, rota.data_fim)}, {descreverCompanhias(rota.companhias)}
        </p>
      </div>

      {confirmandoExclusao ? (
        <div className="flex flex-wrap items-center gap-3 text-sm" role="group" aria-label="Confirmar exclusão">
          <span>Excluir esta rota?</span>
          <Button size="sm" disabled={ocupado} onClick={() => void executar(onExcluir)}>
            {ocupado ? 'Excluindo…' : 'Excluir'}
          </Button>
          <Button variant="link" onClick={() => setConfirmandoExclusao(false)}>
            Manter
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="contorno" size="sm" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="link" className="text-sm" disabled={ocupado} onClick={() => void executar(onAlternarAtivo)}>
            {rota.ativo ? 'Pausar' : 'Retomar'}
          </Button>
          <Button variant="link" className="text-sm" onClick={() => setConfirmandoExclusao(true)}>
            Excluir
          </Button>
        </div>
      )}

      {erro && (
        <p role="alert" className="text-sm text-texto md:col-span-2">
          {erro}
        </p>
      )}
    </li>
  )
}
