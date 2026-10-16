const DIA_MS = 86_400_000

/** "15/12/2026" → "2026-12-15". */
export function brParaISO(br: string): string {
  const [dia, mes, ano] = br.split('/')
  return `${ano}-${mes}-${dia}`
}

/** "2026-12-15" → "15/12/2026". */
export function isoParaBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/** Aceita só datas reais no formato "AAAA-MM-DD" (recusa 2026-02-30). */
export function dataISOValida(iso: unknown): iso is string {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const data = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === iso
}

/** Quantos dias de `deISO` até `paraISO` (negativo se for antes). */
export function diasEntre(deISO: string, paraISO: string): number {
  return Math.round((Date.parse(`${paraISO}T00:00:00Z`) - Date.parse(`${deISO}T00:00:00Z`)) / DIA_MS)
}

/** Soma `dias` a toda data "DD/MM/AAAA" que aparecer no texto (inclusive dentro de "DD/MM/AAAA HH:MM"). */
export function deslocarDatasTexto(texto: string, dias: number): string {
  return texto.replace(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g, (_, dia: string, mes: string, ano: string) => {
    const nova = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia) + dias))
    return isoParaBR(nova.toISOString().slice(0, 10))
  })
}

/** A data de hoje em São Paulo, "AAAA-MM-DD". */
export function hojeSaoPaulo(agora: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora)
}

/** Meia-noite de hoje em São Paulo. O Brasil não usa horário de verão desde 2019: o fuso é fixo (-03:00). */
export function inicioDoDiaSaoPaulo(agora: Date): string {
  return `${hojeSaoPaulo(agora)}T00:00:00-03:00`
}
