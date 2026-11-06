import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import type { AlertaPrecoAlvo } from '@/lib/alertas'
import { dataPorExtenso, hojeISO } from '@/lib/datas'
import { formatarMilhas, formatarReais } from '@/lib/formato'
import { descreverCompanhias, periodoDaIda, type Rota } from '@/lib/rotas'
import { urlResultados } from '@/lib/urlBusca'
import { cn } from '@/lib/utils'

type Props = {
  rota: Rota
  /** Alerta recente desta rota: a rota "chegou ao preço-alvo". */
  alerta?: AlertaPrecoAlvo | null
  onEditar: () => void
  onAlternarAtivo: () => Promise<{ erro: string | null }>
  onExcluir: () => Promise<{ erro: string | null }>
}

/** Meta x preço do alerta, na mesma escala. Só existe quando há um alerta com preço comparável. */
function comparacaoDoAlerta(rota: Rota, alerta: AlertaPrecoAlvo) {
  if (alerta.milhas !== null && rota.preco_alvo_milhas) {
    return { meta: rota.preco_alvo_milhas, valor: alerta.milhas, formatar: (n: number) => `${formatarMilhas(n)} mi` }
  }
  if (alerta.valorReais !== null && rota.preco_alvo_rs) {
    return { meta: rota.preco_alvo_rs, valor: alerta.valorReais, formatar: formatarReais }
  }
  return null
}

function ReguaMeta({ meta, valor, formatar }: { meta: number; valor: number; formatar: (n: number) => string }) {
  const maior = Math.max(meta, valor)
  const largura = (n: number) => `calc((100% - 8rem) * ${n / maior})`
  return (
    <div
      role="img"
      aria-label={`Meta ${formatar(meta)}, oferta ${formatar(valor)}`}
      className="flex min-w-0 flex-col gap-2"
    >
      <div className="flex items-center gap-2" aria-hidden>
        <div
          className="h-2.5 flex-none origin-left rounded-[2px] bg-vm-bar-dinheiro motion-safe:animate-crescer"
          style={{ width: largura(meta) }}
        />
        <span className="whitespace-nowrap text-[13px] text-vm-ink-muted vm-num">Meta {formatar(meta)}</span>
      </div>
      <div className="flex items-center gap-2" aria-hidden>
        <div
          className={cn(
            'h-2.5 flex-none origin-left rounded-[2px] bg-vm-gold-500 motion-safe:animate-crescer',
            valor > meta && 'opacity-40',
          )}
          style={{ width: largura(valor) }}
        />
        <span className="whitespace-nowrap text-[13px] text-vm-ink-muted vm-num">Oferta {formatar(valor)}</span>
      </div>
    </div>
  )
}

function textoMeta(rota: Rota): string {
  const partes: string[] = []
  if (rota.preco_alvo_milhas) partes.push(`${formatarMilhas(rota.preco_alvo_milhas)} mi`)
  if (rota.preco_alvo_rs) partes.push(formatarReais(rota.preco_alvo_rs))
  return `Meta ${partes.join(' ou ')}`
}

export function LinhaRota({ rota, alerta, onEditar, onAlternarAtivo, onExcluir }: Props) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const executar = async (acao: () => Promise<{ erro: string | null }>) => {
    setOcupado(true)
    const { erro } = await acao()
    setOcupado(false)
    setErro(erro)
  }

  const atingiu = rota.ativo && alerta ? alerta : null
  const comparacao = atingiu ? comparacaoDoAlerta(rota, atingiu) : null
  const hoje = hojeISO()
  const idaBusca = atingiu?.dataVoo ?? (rota.data_inicio > hoje ? rota.data_inicio : hoje)
  const linkOfertas = urlResultados({ origem: rota.origem, destino: rota.destino, ida: idaBusca, volta: '' })

  const detalheAtingiu = atingiu
    ? [atingiu.companhia ?? atingiu.programa, atingiu.voo && `voo ${atingiu.voo}`, atingiu.dataVoo && dataPorExtenso(atingiu.dataVoo)]
        .filter(Boolean)
        .join(', ')
    : ''

  return (
    <li className="flex flex-col gap-3.5 rounded-vm-md bg-vm-surface-card p-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:items-center md:gap-6 md:rounded-none md:border-b md:border-vm-line md:bg-transparent md:p-6">
      <div className={cn(!rota.ativo && 'opacity-60')}>
        <p className="text-[26px] font-light leading-8 tracking-[0.02em] md:text-numeral">
          <span className="sr-only">
            {rota.origem} para {rota.destino}
          </span>
          <span aria-hidden>
            {rota.origem} <span className="text-vm-bar-dinheiro">–</span> {rota.destino}
          </span>
        </p>
        <p className="mt-1 text-sm text-vm-ink-muted">
          {periodoDaIda(rota.data_inicio, rota.data_fim)}
          <br />
          {descreverCompanhias(rota.companhias)}
        </p>
      </div>

      {comparacao ? (
        <ReguaMeta {...comparacao} />
      ) : (
        <p className={cn('text-[13px] text-vm-ink-muted vm-num', !rota.ativo && 'opacity-60')}>{textoMeta(rota)}</p>
      )}

      <div className="flex flex-col gap-3">
        <div>
          {atingiu ? (
            <p className="flex items-center gap-2 text-lg font-semibold leading-6 text-vm-burgundy-600">
              <span className="h-2 w-2 flex-none rounded-full bg-vm-burgundy-600" aria-hidden />
              Chegou ao seu preço-alvo
            </p>
          ) : (
            <p className={cn('text-lg font-semibold leading-6', !rota.ativo && 'text-vm-ink-muted')}>
              {rota.ativo ? 'Monitorando' : 'Pausada'}
            </p>
          )}
          <p className="mt-0.5 text-[13px] text-vm-ink-muted">
            {atingiu
              ? `${detalheAtingiu}.`
              : rota.ativo
                ? 'Conferimos esta rota uma vez por dia.'
                : 'Sem alertas enquanto estiver pausada.'}
          </p>
        </div>

        {confirmandoExclusao ? (
          <div className="flex flex-wrap items-center gap-3 text-sm" role="group" aria-label="Confirmar exclusão">
            <span>Excluir esta rota?</span>
            <Button size="sm" className="h-11 md:h-[38px]" disabled={ocupado} onClick={() => void executar(onExcluir)}>
              {ocupado ? 'Excluindo…' : 'Excluir'}
            </Button>
            <Button variant="link" className="min-h-11" onClick={() => setConfirmandoExclusao(false)}>
              Manter
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Button variant="contorno" size="sm" className="h-11 md:h-[38px]" asChild>
              <Link to={linkOfertas}>Ver ofertas</Link>
            </Button>
            <Button variant="link" className="min-h-11" onClick={onEditar}>
              Editar
            </Button>
            <Button
              variant="link"
              className="min-h-11 text-vm-ink-muted"
              disabled={ocupado}
              onClick={() => void executar(onAlternarAtivo)}
            >
              {rota.ativo ? 'Pausar' : 'Retomar'}
            </Button>
            <Button variant="link" className="min-h-11 text-vm-ink-muted" onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </Button>
          </div>
        )}

        {erro && (
          <p role="alert" className="text-[13px] text-vm-burgundy-600">
            {erro}
          </p>
        )}
      </div>
    </li>
  )
}
