import { adaptarRespostaMock, escolherMock, respostaVazia } from './mock.ts'
import type { LinhaMock, Obj, PedidoCompanhia } from './tipos.ts'

/** Quem responde às buscas: devolve o JSON no formato exato do Busca Milhas, para uma companhia. */
export type Fonte = (pedido: PedidoCompanhia) => Promise<Obj>

/** Banco fake: lê as respostas gravadas em public.mock_respostas_api. Não gasta consulta paga. */
// deno-lint-ignore no-explicit-any
export function fonteMock(db: any): Fonte {
  return async (pedido) => {
    const { data, error } = await db
      .from('mock_respostas_api')
      .select('origem, destino, data_voo, data_volta, companhia, response_json')
      .eq('companhia', pedido.companhia)
      .limit(500)
    if (error) throw error
    const escolhida = escolherMock((data ?? []) as LinhaMock[], pedido)
    return escolhida ? adaptarRespostaMock(escolhida, pedido) : respostaVazia(pedido)
  }
}

/** API real do Busca Milhas: ainda não ligada (entra na reta final do projeto). */
export function fonteReal(): Fonte {
  return () => Promise.reject(new Error('A fonte real (Busca Milhas) ainda não foi ligada.'))
}
