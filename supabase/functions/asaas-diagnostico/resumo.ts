// Transforma as respostas do Asaas em um resumo curto e seguro para o diagnóstico. Funções puras.

/** Eventos que o nosso webhook usa; se faltar algum no cadastro do Asaas, o sistema perde aquele aviso. */
export const EVENTOS_NECESSARIOS = [
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_INACTIVATED',
] as const

// deno-lint-ignore no-explicit-any
type Item = Record<string, any>

export function resumirWebhook(w: Item) {
  const eventos: string[] = Array.isArray(w.events) ? w.events.filter((e: unknown) => typeof e === 'string') : []
  return {
    nome: w.name ?? null,
    url: w.url ?? null,
    ativo: w.enabled === true,
    filaInterrompida: w.interrupted === true,
    requisicoesPenalizadas: typeof w.penalizedRequestsCount === 'number' ? w.penalizedRequestsCount : null,
    tipoEnvio: w.sendType ?? null,
    versaoApi: w.apiVersion ?? null,
    temToken: w.hasAuthToken === true,
    totalEventos: eventos.length,
    eventosFaltando: EVENTOS_NECESSARIOS.filter((e) => !eventos.includes(e)),
  }
}

export type NossaAssinatura = { status: string; acessoAte: string | null }

export type CobrancaResumo = { status: string; dueDate: string; value: number | null; billingType: string | null }

/**
 * Compara o que o Asaas diz com o que temos no banco. Devolve uma frase quando divergem, ou null quando bate.
 * (As divergências são o que o webhook deveria ter corrigido e não corrigiu.)
 */
export function divergencia(
  nossa: NossaAssinatura,
  asaas: { status: string | null; deleted: boolean },
  cobrancas: readonly CobrancaResumo[],
): string | null {
  const encerradaNoAsaas = asaas.deleted || asaas.status === 'INACTIVE' || asaas.status === 'EXPIRED'
  const abertas = cobrancas.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE')
  const vencidas = cobrancas.filter((c) => c.status === 'OVERDUE')
  const pagas = cobrancas.filter((c) => c.status === 'RECEIVED' || c.status === 'CONFIRMED')

  if (encerradaNoAsaas && nossa.status === 'ativo' && !nossa.acessoAte) {
    return 'Cancelada no Asaas, mas ativa aqui sem data de fim de acesso.'
  }
  if (nossa.status === 'pendente' && abertas.length === 0 && pagas.length > 0) {
    return 'Paga no Asaas, mas pendente aqui.'
  }
  if (nossa.status === 'ativo' && vencidas.length > 0) {
    return 'Cobrança vencida no Asaas, mas assinatura ativa aqui.'
  }
  if (nossa.status === 'inadimplente' && abertas.length === 0 && pagas.length > 0) {
    return 'Sem cobrança em aberto no Asaas, mas inadimplente aqui.'
  }
  return null
}

export function resumirCobranca(p: Item): CobrancaResumo {
  return {
    status: String(p.status ?? ''),
    dueDate: String(p.dueDate ?? ''),
    value: typeof p.value === 'number' ? p.value : null,
    billingType: typeof p.billingType === 'string' ? p.billingType : null,
  }
}
