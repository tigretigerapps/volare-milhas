// Conferência diária: compara cada assinatura nossa com o que o Asaas diz e decide o que corrigir.
// Pega o que o webhook deveria ter avisado e não avisou. Funções puras, sem rede nem banco.

export type Nossa = { status: string; acessoAte: string | null; proximaCobranca: string | null }
export type EstadoAsaas = { status: string | null; deleted: boolean }
export type Cobranca = { status: string; dueDate: string }

export type Correcao = {
  status: string
  acesso_ate?: string | null
  proxima_cobranca?: string
  motivo: string
}

/** "2026-10-31" + 1 mês = "2026-11-30" (o dia encolhe quando o mês seguinte é mais curto). */
export function somarUmMes(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))).toISOString().slice(0, 10)
}

/**
 * Cancelamento: quem já pagou o período mantém o acesso até o fim dele; sem período pago pela frente, cancela na hora.
 * (Mesma regra do webhook.)
 */
export function decidirCancelamento(atual: Nossa, hoje: string): { status: 'ativo' | 'cancelado'; acessoAte: string | null } {
  if (atual.acessoAte) {
    return atual.acessoAte >= hoje ? { status: 'ativo', acessoAte: atual.acessoAte } : { status: 'cancelado', acessoAte: atual.acessoAte }
  }
  if (atual.status === 'ativo' && atual.proximaCobranca && atual.proximaCobranca >= hoje) {
    return { status: 'ativo', acessoAte: atual.proximaCobranca }
  }
  return { status: 'cancelado', acessoAte: null }
}

const SITUACOES_CONFERIDAS = ['ativo', 'pendente', 'inadimplente']

/** Devolve a correção a aplicar, ou null quando o que temos já bate com o Asaas. `hoje` em "AAAA-MM-DD". */
export function decidirConciliacao(nossa: Nossa, asaas: EstadoAsaas, cobrancas: readonly Cobranca[], hoje: string): Correcao | null {
  if (!SITUACOES_CONFERIDAS.includes(nossa.status)) return null

  const abertas = cobrancas.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE')
  const vencidas = cobrancas.filter((c) => c.status === 'OVERDUE')
  const pagas = cobrancas.filter((c) => c.status === 'RECEIVED' || c.status === 'CONFIRMED')

  const encerrada = asaas.deleted || asaas.status === 'INACTIVE' || asaas.status === 'EXPIRED'
  if (encerrada) {
    const d = decidirCancelamento(nossa, hoje)
    if (d.status === nossa.status && d.acessoAte === nossa.acessoAte) return null
    return { status: d.status, acesso_ate: d.acessoAte, motivo: 'Cancelada no Asaas.' }
  }

  if ((nossa.status === 'pendente' || nossa.status === 'inadimplente') && abertas.length === 0 && pagas.length > 0) {
    const ultima = pagas.map((p) => p.dueDate).sort().at(-1) as string
    return { status: 'ativo', proxima_cobranca: somarUmMes(ultima), motivo: 'Paga no Asaas.' }
  }

  if (nossa.status === 'ativo' && vencidas.length > 0) {
    return { status: 'inadimplente', motivo: 'Cobrança vencida no Asaas.' }
  }
  return null
}
