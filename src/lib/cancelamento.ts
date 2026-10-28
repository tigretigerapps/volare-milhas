/** "2026-11-28" → "28/11/2026". */
export function dataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export type SituacaoDaAssinatura =
  | { tipo: 'ativa'; renovaEm: string | null }
  | { tipo: 'cancelada'; acessoAte: string }
  | { tipo: 'outra' }

/** Resume a linha de subscriptions para a tela Conta: renovando, cancelada com acesso até uma data, ou nenhuma das duas. */
export function situacaoDaAssinatura(
  assinatura: { status: string; proxima_cobranca: string | null; acesso_ate: string | null } | null,
): SituacaoDaAssinatura {
  if (!assinatura || assinatura.status !== 'ativo') return { tipo: 'outra' }
  if (assinatura.acesso_ate) return { tipo: 'cancelada', acessoAte: assinatura.acesso_ate }
  return { tipo: 'ativa', renovaEm: assinatura.proxima_cobranca }
}
