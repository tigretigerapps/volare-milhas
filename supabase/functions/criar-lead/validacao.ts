import { limparNomeCidade } from './payload.ts'

/** Só datas reais no formato "AAAA-MM-DD" (recusa 2026-02-30). */
function dataISOValida(iso: unknown): iso is string {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const data = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === iso
}

export type PedidoLead = {
  ofertaId: string
  dataIda: string
  dataVolta: string | null
  cidadeOrigem: string | null
  cidadeDestino: string | null
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validarPedidoLead(corpo: unknown): { ok: true; pedido: PedidoLead } | { ok: false; mensagem: string } {
  if (typeof corpo !== 'object' || corpo === null) return { ok: false, mensagem: 'Pedido inválido.' }
  const c = corpo as Record<string, unknown>
  if (typeof c.oferta_id !== 'string' || !uuid.test(c.oferta_id)) return { ok: false, mensagem: 'Oferta inválida.' }
  if (!dataISOValida(c.data_ida)) return { ok: false, mensagem: 'Data de ida inválida.' }
  let dataVolta: string | null = null
  if (c.data_volta !== undefined && c.data_volta !== null && c.data_volta !== '') {
    if (!dataISOValida(c.data_volta)) return { ok: false, mensagem: 'Data de volta inválida.' }
    dataVolta = c.data_volta
  }
  return {
    ok: true,
    pedido: {
      ofertaId: c.oferta_id.toLowerCase(),
      dataIda: c.data_ida,
      dataVolta,
      cidadeOrigem: limparNomeCidade(c.cidade_origem),
      cidadeDestino: limparNomeCidade(c.cidade_destino),
    },
  }
}
