/** Data local de hoje no formato "AAAA-MM-DD". */
export function hojeISO(agora = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/** Soma dias a uma data "AAAA-MM-DD" (sem depender do fuso do navegador). */
export function somarDiasISO(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

const porExtenso = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

/** "2026-12-15" → "15 de dezembro" (sem o ano), como nos títulos das telas. */
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return porExtenso.format(new Date(Date.UTC(ano, mes - 1, dia)))
}
