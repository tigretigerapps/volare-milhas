/**
 * Lê o milheiro digitado pelo usuário no formato brasileiro.
 * "20" → 20, "20,50" → 20.5, "1.020,00" → 1020. Devolve null se não for um valor positivo.
 */
export function interpretarMilheiro(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/i, '')
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) return null
  const numero = Number(limpo.replace(/\./g, '').replace(',', '.'))
  return numero > 0 ? numero : null
}

/** 20 → "20,00", para preencher o campo de edição. */
export function milheiroParaCampo(valor: number): string {
  return valor.toFixed(2).replace('.', ',')
}
