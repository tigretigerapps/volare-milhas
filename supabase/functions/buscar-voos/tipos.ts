// Objeto JSON solto: o retorno do Busca Milhas é mantido exatamente como a API devolve.
// deno-lint-ignore no-explicit-any
export type Obj = Record<string, any>

/** O que o usuário pediu, já validado e normalizado. */
export type PedidoBusca = {
  origem: string
  destino: string
  /** "AAAA-MM-DD" */
  dataIda: string
  /** "AAAA-MM-DD", ou null para só ida. */
  dataVolta: string | null
  companhias: string[]
}

/** A API cobra e responde por companhia: uma chamada por vez. */
export type PedidoCompanhia = Omit<PedidoBusca, 'companhias'> & { companhia: string }

export type ErroPedido = { codigo: string; mensagem: string }

/** Linha de public.mock_respostas_api. */
export type LinhaMock = {
  origem: string
  destino: string
  data_voo: string
  data_volta: string | null
  companhia: string
  response_json: Obj
}
