import { Button } from '@/components/ui/button'
import type { Oferta } from '@/data/exemplo'
import type { EstadoLead } from '@/hooks/useLeads'
import { compararOferta } from '@/lib/comparacao'
import { formatarDuracao, formatarParadas, unidadeMilhas } from '@/lib/formato'
import { Regua } from './Regua'
import { Veredito } from './Veredito'

type Props = {
  oferta: Oferta
  milheiro: number
  /** Chamado ao tocar em "Quero essa oferta". */
  onQuero?: (oferta: Oferta) => void
  lead?: EstadoLead
}

/**
 * Uma tarifa: voo, régua e veredito.
 * Celular: card branco empilhado. Desktop: linha de 3 colunas dentro de um bloco branco, separada por fio.
 */
export function LinhaResultado({ oferta, milheiro, onQuero, lead }: Props) {
  const enviando = lead?.tipo === 'enviando'
  const enviado = lead?.tipo === 'ok'
  const comparacao = compararOferta(oferta, milheiro)

  return (
    <li className="flex flex-col gap-3.5 rounded-vm-md bg-vm-surface-card p-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:items-center md:gap-6 md:rounded-none md:border-b md:border-vm-line md:bg-transparent md:p-6 md:last:border-b-0">
      <div>
        <p className="text-[26px] font-light leading-8 vm-num md:text-numeral">
          {oferta.partida} – {oferta.chegada}
        </p>
        <p className="mt-1 text-sm text-vm-ink-muted">
          {oferta.origem} para {oferta.destino}, {formatarParadas(oferta.paradas)},{' '}
          <span className="vm-num">{formatarDuracao(oferta.duracaoMinutos)}</span>
        </p>
        <p className="text-sm text-vm-ink-muted">
          {oferta.programa}, voo {oferta.voo}
        </p>
      </div>

      <Regua
        dinheiro={oferta.dinheiro}
        milhas={oferta.milhas}
        taxas={oferta.taxas}
        larguraDinheiro={comparacao.larguraDinheiro}
        larguraMilhas={comparacao.larguraMilhas}
        vencedor={comparacao.vencedor}
        diferenca={comparacao.diferencaArredondada}
        unidade={unidadeMilhas(oferta)}
      />

      <div className="flex flex-col items-stretch gap-3 md:items-start">
        <Veredito
          vencedor={comparacao.vencedor}
          diferenca={comparacao.diferencaArredondada}
          milheiro={milheiro}
          taxaResgate={oferta.taxaResgate}
        />
        <Button
          variant="contorno"
          className="w-full md:h-[38px] md:w-auto md:px-3.5"
          disabled={enviando || enviado}
          onClick={() => onQuero?.(oferta)}
        >
          {enviando ? 'Enviando…' : enviado ? 'Pedido enviado' : 'Quero essa oferta'}
        </Button>
        {lead?.tipo === 'ok' && (
          <p className="text-[13px] text-vm-ink-muted" role="status">
            A equipe da Volare vai falar com você. Referência {lead.referencia}.
            {lead.simulado && ' (Teste: nada foi enviado ao CRM.)'}
          </p>
        )}
        {lead?.tipo === 'erro' && (
          <p className="text-[13px] text-vm-burgundy-600" role="alert">
            {lead.mensagem}
          </p>
        )}
      </div>
    </li>
  )
}
