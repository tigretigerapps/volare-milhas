// Como os eventos do Asaas viram a situação da assinatura. Funções puras, sem rede nem banco.

export type Situacao = 'ativo' | 'inadimplente' | 'cancelado'

export type EventoAsaas = {
  id: string
  event: string
  payment?: { subscription?: string | null; dueDate?: string | null }
  subscription?: { id?: string | null }
}

export type Efeito = {
  assinaturaId: string
  situacao: Situacao
  /** Próxima cobrança, quando o pagamento confirma o mês. */
  proximaCobranca?: string
}

/** Pago: o plano vale. */
const PAGOS = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']
/** Dinheiro que volta ou some: o acesso sai até regularizar. */
const PERDIDOS = ['PAYMENT_OVERDUE', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED']
const ENCERRADOS = ['SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED']

/** "2026-10-31" + 1 mês = "2026-11-30" (o dia encolhe quando o mês seguinte é mais curto). */
export function somarUmMes(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))).toISOString().slice(0, 10)
}

const dataValida = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** O que o evento muda na assinatura, ou null para os eventos que não interessam (criada, visualizada...). */
export function efeitoDoEvento(e: EventoAsaas): Efeito | null {
  if (PAGOS.includes(e.event) && e.payment?.subscription) {
    return {
      assinaturaId: e.payment.subscription,
      situacao: 'ativo',
      ...(dataValida(e.payment.dueDate) ? { proximaCobranca: somarUmMes(e.payment.dueDate) } : {}),
    }
  }
  if (PERDIDOS.includes(e.event) && e.payment?.subscription) {
    return { assinaturaId: e.payment.subscription, situacao: 'inadimplente' }
  }
  if (ENCERRADOS.includes(e.event) && e.subscription?.id) {
    return { assinaturaId: e.subscription.id, situacao: 'cancelado' }
  }
  return null
}

/**
 * Evento atrasado não deve desfazer um cancelamento: cobrança que vence depois de a assinatura ser
 * cancelada continua cancelada. Só um pagamento novo reativa.
 */
export function situacaoFinal(atual: string, nova: Situacao): Situacao {
  return atual === 'cancelado' && nova === 'inadimplente' ? 'cancelado' : nova
}
