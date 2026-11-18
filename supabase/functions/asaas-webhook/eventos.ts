// Como os eventos do Asaas viram a situação da assinatura. Funções puras, sem rede nem banco.

export type Situacao = 'ativo' | 'inadimplente' | 'cancelado'

export type EventoAsaas = {
  id: string
  event: string
  payment?: { subscription?: string | null; dueDate?: string | null }
  subscription?: {
    id?: string | null
    customer?: string | null
    billingType?: string | null
    nextDueDate?: string | null
    status?: string | null
    deleted?: boolean | null
    externalReference?: string | null
  }
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

export type EstadoAssinatura = {
  status: string
  proximaCobranca: string | null
  acessoAte: string | null
}

export type DecisaoCancelamento = { status: 'ativo' | 'cancelado'; acessoAte: string | null }

/**
 * Cancelamento (feito pelo assinante ou direto no painel do Asaas): quem já pagou o período mantém o acesso
 * até o fim dele; o cancelamento só vale na hora para quem não tem período pago pela frente.
 * `hoje` no formato "AAAA-MM-DD".
 */
export function decidirCancelamento(atual: EstadoAssinatura, hoje: string): DecisaoCancelamento {
  if (atual.acessoAte) {
    // Já estava agendado: não antecipa nem adia.
    return atual.acessoAte >= hoje ? { status: 'ativo', acessoAte: atual.acessoAte } : { status: 'cancelado', acessoAte: atual.acessoAte }
  }
  if (atual.status === 'ativo' && atual.proximaCobranca && atual.proximaCobranca >= hoje) {
    return { status: 'ativo', acessoAte: atual.proximaCobranca }
  }
  return { status: 'cancelado', acessoAte: null }
}

export type LigacaoTeste = {
  assinaturaId: string
  clienteId: string | null
  /** Nosso id de usuário, quando o checkout repassa o externalReference para a assinatura. */
  usuarioId: string | null
  proximaCobranca: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Assinatura criada pelo checkout do teste grátis: no cartão, ativa e com a primeira cobrança no futuro.
 * A assinatura paga comum ("UNDEFINED", vence no dia) não entra aqui. `hoje` em "AAAA-MM-DD".
 */
export function ligacaoDeTeste(e: EventoAsaas, hoje: string): LigacaoTeste | null {
  const a = e.subscription
  if (e.event !== 'SUBSCRIPTION_CREATED' || !a?.id) return null
  if (a.deleted === true || (a.status && a.status !== 'ACTIVE') || a.billingType !== 'CREDIT_CARD') return null
  const proxima = typeof a.nextDueDate === 'string' ? a.nextDueDate.slice(0, 10) : ''
  if (!dataValida(proxima) || proxima <= hoje) return null
  const usuarioId = typeof a.externalReference === 'string' && UUID.test(a.externalReference) ? a.externalReference : null
  // Só letras, números e _ (ex.: cus_000123): o id entra num filtro do banco.
  const clienteId = typeof a.customer === 'string' && /^[A-Za-z0-9_]+$/.test(a.customer) ? a.customer : null
  if (!usuarioId && !clienteId) return null
  return { assinaturaId: a.id, clienteId, usuarioId, proximaCobranca: proxima }
}
