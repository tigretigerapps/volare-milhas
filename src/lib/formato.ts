const reaisInteiros = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const reaisComCentavos = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** "R$ 528". O espaço é inseparável para "R$" nunca ficar sozinho no fim da linha. */
export function formatarReais(valor: number): string {
  return reaisInteiros.format(Math.round(valor)).replace(/\s/, ' ')
}

/** "R$ 20,00". */
export function formatarReaisComCentavos(valor: number): string {
  return reaisComCentavos.format(valor).replace(/\s/, ' ')
}

/** "R$ 20" quando inteiro, "R$ 17,50" quando tem centavos. */
export function formatarMilheiro(valor: number): string {
  return Number.isInteger(valor) ? formatarReais(valor) : formatarReaisComCentavos(valor)
}

/** "18.500". */
export function formatarMilhas(milhas: number): string {
  return inteiro.format(milhas)
}

/** 150 → "2h30", 60 → "1h", 65 → "1h05". */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** [] → "direto", ["BSB"] → "1 parada em BSB", ["BSB", "REC"] → "2 paradas em BSB e REC". */
export function formatarParadas(paradas: readonly string[]): string {
  if (paradas.length === 0) return 'direto'
  const lista = new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(paradas)
  return `${paradas.length} ${paradas.length === 1 ? 'parada' : 'paradas'} em ${lista}`
}
