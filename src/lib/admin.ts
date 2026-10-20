import type { Json } from '@/integrations/supabase/types'

export const statusLead = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'em_atendimento', rotulo: 'Em atendimento' },
  { valor: 'fechado', rotulo: 'Fechado' },
  { valor: 'perdido', rotulo: 'Perdido' },
] as const

export const statusAssinatura: Record<string, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  inadimplente: 'Inadimplente',
  cancelado: 'Cancelado',
}

type LeadCrm = { crm_status: string; crm_id: number | null; crm_erro: string | null }

/** Situação do envio ao CRM, em uma frase. */
export function rotuloCrm(lead: LeadCrm): string {
  switch (lead.crm_status) {
    case 'enviado':
      return lead.crm_id ? `Enviado ao CRM (solicitação ${lead.crm_id})` : 'Enviado ao CRM'
    case 'falhou':
      return 'Falhou no envio ao CRM'
    case 'simulado':
      return 'Teste: não enviado ao CRM'
    default:
      return 'Aguardando envio ao CRM'
  }
}

const objeto = (valor: Json): Record<string, Json | undefined> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor) ? valor : {}

/** "LATAM LA8146, GRU para LIS, 128.000 milhas" a partir do snapshot da oferta guardado no lead. */
export function resumirOferta(oferta: Json): string {
  const o = objeto(oferta)
  const texto = (v: Json | undefined) => (typeof v === 'string' ? v : '')
  const voo = [texto(o.companhia), texto(o.numero_voo)].filter(Boolean).join(' ')
  const trecho = o.origem && o.destino ? `${texto(o.origem)} para ${texto(o.destino)}` : ''
  const milhas = typeof o.milhas === 'number' ? `${o.milhas.toLocaleString('pt-BR')} milhas` : ''
  return [voo, trecho, milhas].filter(Boolean).join(', ') || 'Oferta sem detalhes'
}

/** "20/10/2026 14:03", no horário de São Paulo. */
export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/** Referência exibida no lead e no CRM: "VM-" mais os 8 primeiros caracteres do id. */
export const referenciaLead = (id: string) => `VM-${id.slice(0, 8).toUpperCase()}`
