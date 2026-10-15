const decimalBR = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/
const inteiroBR = /^(\d{1,3}(\.\d{3})+|\d+)$/

/**
 * Lê um valor em reais digitado no formato brasileiro.
 * "20" → 20, "20,5" → 20.5, "1.020,00" → 1020, "R$ 22" → 22. Devolve null se não for positivo.
 */
export function interpretarDecimalBR(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/i, '')
  if (!decimalBR.test(limpo)) return null
  const numero = Number(limpo.replace(/\./g, '').replace(',', '.'))
  return numero > 0 ? numero : null
}

/** "40.000" → 40000, "40000" → 40000. Devolve null se não for um inteiro positivo. */
export function interpretarInteiroBR(texto: string): number | null {
  const limpo = texto.trim()
  if (!inteiroBR.test(limpo)) return null
  const numero = Number(limpo.replace(/\./g, ''))
  return numero > 0 ? numero : null
}
