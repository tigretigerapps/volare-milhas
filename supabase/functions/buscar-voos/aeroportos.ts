/** Códigos de cidade (metropolitanos) e os aeroportos que eles cobrem. */
export const CIDADES: Record<string, readonly string[]> = {
  SAO: ['GRU', 'CGH', 'VCP'],
  RIO: ['GIG', 'SDU'],
  BHZ: ['CNF', 'PLU'],
  BUE: ['EZE', 'AEP'],
  NYC: ['JFK', 'EWR', 'LGA'],
  LON: ['LHR', 'LGW', 'STN', 'LCY'],
  PAR: ['CDG', 'ORY'],
}

/** O próprio código, os aeroportos da cidade (se for cidade) e a cidade do aeroporto (se for aeroporto). */
export function equivalentes(codigo: string): Set<string> {
  const conjunto = new Set([codigo])
  for (const aeroporto of CIDADES[codigo] ?? []) conjunto.add(aeroporto)
  for (const [cidade, aeroportos] of Object.entries(CIDADES)) {
    if (aeroportos.includes(codigo)) conjunto.add(cidade)
  }
  return conjunto
}

/**
 * O código que o usuário pediu "casa" com o aeroporto de um voo?
 * Pedido por cidade (SAO) aceita qualquer aeroporto dela; pedido por aeroporto (GRU) só aquele aeroporto.
 */
export function casa(codigoPedido: string, codigoDoVoo: string): boolean {
  if (CIDADES[codigoPedido]) return equivalentes(codigoPedido).has(codigoDoVoo)
  return codigoPedido === codigoDoVoo
}
