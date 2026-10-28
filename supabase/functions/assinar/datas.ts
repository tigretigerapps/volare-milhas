/** "2026-10-31" + 1 mês = "2026-11-30" (o dia encolhe quando o mês seguinte é mais curto). */
export function somarUmMes(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))).toISOString().slice(0, 10)
}

/** Decide, pelas cobranças no Asaas, se a assinatura já está paga: nenhuma em aberto e ao menos uma paga. */
export function pagamentoConfirmado(c: { emAberto: number; pagas: { dueDate: string }[] }): { proximaCobranca: string } | null {
  if (c.emAberto > 0 || c.pagas.length === 0) return null
  const ultima = c.pagas.map((p) => p.dueDate).sort().at(-1) as string
  return { proximaCobranca: somarUmMes(ultima) }
}
