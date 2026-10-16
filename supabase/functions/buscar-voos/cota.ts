export type AvaliacaoDestinos = {
  /** Rotas diferentes já pesquisadas hoje. */
  usados: number
  /** Esta rota já foi pesquisada hoje: repetir não gasta cota. */
  jaPesquisada: boolean
  permitido: boolean
}

/**
 * Limite de destinos por dia: conta rotas diferentes (origem + destino). Repetir uma rota já pesquisada
 * hoje, mesmo com outra data, não consome cota. `limite` null = sem limite (administrador).
 */
export function avaliarDestinos(
  consultasDeHoje: readonly { origem: string; destino: string }[],
  pedido: { origem: string; destino: string },
  limite: number | null,
): AvaliacaoDestinos {
  const rotas = new Set(consultasDeHoje.map((c) => `${c.origem.trim()}-${c.destino.trim()}`))
  const jaPesquisada = rotas.has(`${pedido.origem}-${pedido.destino}`)
  const usados = rotas.size
  return { usados, jaPesquisada, permitido: limite === null || jaPesquisada || usados < limite }
}
