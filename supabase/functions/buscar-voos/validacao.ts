import { dataISOValida } from './datas.ts'
import type { ErroPedido, PedidoBusca } from './tipos.ts'

/** Companhias que o monitoramento entende (o mesmo texto de ofertas.companhia). */
export const COMPANHIAS_PERMITIDAS = ['GOL', 'AZUL', 'LATAM', 'TAP', 'IBERIA', 'AMERICAN AIRLINES'] as const

/** A API cobra por companhia: limite de companhias consultadas numa mesma busca. */
export const MAX_COMPANHIAS = 4

const invalido = (mensagem: string): { ok: false; erro: ErroPedido } => ({
  ok: false,
  erro: { codigo: 'pedido_invalido', mensagem },
})

export function validarPedido(
  corpo: unknown,
  hoje: string,
): { ok: true; pedido: PedidoBusca } | { ok: false; erro: ErroPedido } {
  if (typeof corpo !== 'object' || corpo === null) return invalido('Pedido de busca inválido.')
  const c = corpo as Record<string, unknown>

  const codigo = (v: unknown) => (typeof v === 'string' && /^[A-Za-z]{3}$/.test(v.trim()) ? v.trim().toUpperCase() : null)
  const origem = codigo(c.origem)
  const destino = codigo(c.destino)
  if (!origem) return invalido('Origem inválida: use o código de 3 letras, como GRU.')
  if (!destino) return invalido('Destino inválido: use o código de 3 letras, como SSA.')
  if (origem === destino) return invalido('O destino precisa ser diferente da origem.')

  if (!dataISOValida(c.dataIda)) return invalido('Data de ida inválida.')
  if (c.dataIda < hoje) return invalido('A data de ida já passou.')
  const dataIda = c.dataIda

  let dataVolta: string | null = null
  if (c.dataVolta !== undefined && c.dataVolta !== null && c.dataVolta !== '') {
    if (!dataISOValida(c.dataVolta)) return invalido('Data de volta inválida.')
    if (c.dataVolta < dataIda) return invalido('A volta precisa ser no mesmo dia da ida ou depois.')
    dataVolta = c.dataVolta
  }

  if (!Array.isArray(c.companhias) || c.companhias.length === 0) return invalido('Escolha ao menos uma companhia.')
  const companhias = [...new Set(c.companhias.map((x) => (typeof x === 'string' ? x.trim().toUpperCase() : '')))]
  const permitidas: readonly string[] = COMPANHIAS_PERMITIDAS
  if (companhias.some((x) => !permitidas.includes(x))) return invalido('Companhia não reconhecida.')
  if (companhias.length > MAX_COMPANHIAS) {
    return invalido(`No máximo ${MAX_COMPANHIAS} companhias por busca.`)
  }

  return { ok: true, pedido: { origem, destino, dataIda, dataVolta, companhias } }
}
