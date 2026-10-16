import { casa, equivalentes } from './aeroportos.ts'
import { brParaISO, deslocarDatasTexto, diasEntre, isoParaBR } from './datas.ts'
import type { LinhaMock, Obj, PedidoCompanhia } from './tipos.ts'

const statusOk = () => ({ Erro: false, Alerta: [], Sucesso: true })

function token(pedido: PedidoCompanhia): string {
  const volta = pedido.dataVolta ? isoParaBR(pedido.dataVolta) : 'undefined'
  return `BUSCA_MOCK_${pedido.origem}:${pedido.destino}_${isoParaBR(pedido.dataIda)}:${volta}_${pedido.companhia}`
}

function montarBusca(pedido: PedidoCompanhia, internacional: number): Obj {
  return {
    Hash: token(pedido),
    Bebes: 0,
    Chave: 'XXXX',
    Senha: 'XXXX',
    Classe: 'economica',
    Adultos: 1,
    Trechos: [
      {
        Origem: pedido.origem,
        DataIda: isoParaBR(pedido.dataIda),
        Destino: pedido.destino,
        ...(pedido.dataVolta ? { DataVolta: isoParaBR(pedido.dataVolta) } : {}),
      },
    ],
    Criancas: 0,
    Companhias: [pedido.companhia],
    TipoViagem: pedido.dataVolta ? 1 : 0,
    Internacional: internacional,
  }
}

/**
 * Escolhe, entre as respostas fake de uma companhia, a que melhor serve ao pedido:
 * mesma rota (aceitando cidade/aeroporto equivalentes), mesmo tipo de viagem (só ida ou ida e volta)
 * e a data mais próxima. Devolve null se a rota não existe no mock.
 */
export function escolherMock(linhas: readonly LinhaMock[], pedido: PedidoCompanhia): LinhaMock | null {
  const origens = equivalentes(pedido.origem)
  const destinos = equivalentes(pedido.destino)
  const candidatas = linhas.filter(
    (l) => l.companhia === pedido.companhia && origens.has(l.origem.trim()) && destinos.has(l.destino.trim()),
  )
  if (candidatas.length === 0) return null

  const pontos = (l: LinhaMock) => ({
    mesmoTipo: Boolean(l.data_volta) === Boolean(pedido.dataVolta) ? 0 : 1,
    rotaExata: l.origem.trim() === pedido.origem && l.destino.trim() === pedido.destino ? 0 : 1,
    distancia: Math.abs(diasEntre(l.data_voo, pedido.dataIda)),
  })
  return [...candidatas].sort((a, b) => {
    const pa = pontos(a)
    const pb = pontos(b)
    return pa.mesmoTipo - pb.mesmoTipo || pa.rotaExata - pb.rotaExata || pa.distancia - pb.distancia
  })[0]
}

function sentidoDoTrecho(trecho: Obj, pedido: PedidoCompanhia): 'ida' | 'volta' | null {
  if (equivalentes(pedido.origem).has(trecho.Origem) && equivalentes(pedido.destino).has(trecho.Destino)) return 'ida'
  if (equivalentes(pedido.destino).has(trecho.Origem) && equivalentes(pedido.origem).has(trecho.Destino)) return 'volta'
  return null
}

/**
 * Reaproveita uma resposta fake como se a API tivesse respondido ao pedido:
 *  - mantém só os trechos do tipo de viagem pedido;
 *  - mantém só os voos dos aeroportos pedidos (buscar GRU não traz voo que sai de VCP);
 *  - troca origem/destino pelos códigos pedidos e desloca todas as datas para as datas pedidas.
 * O restante do formato fica exatamente como o Busca Milhas devolve, para o parser do banco ser o mesmo.
 */
export function adaptarRespostaMock(mock: LinhaMock, pedido: PedidoCompanhia): Obj {
  const original = structuredClone(mock.response_json) as Obj
  const trechos: Obj = {}

  for (const trecho of Object.values(original.Trechos ?? {}) as Obj[]) {
    const sentido = sentidoDoTrecho(trecho, pedido)
    if (!sentido) continue
    if (sentido === 'volta' && !pedido.dataVolta) continue

    const ida = sentido === 'ida'
    const origem = ida ? pedido.origem : pedido.destino
    const destino = ida ? pedido.destino : pedido.origem
    const dataAlvo = ida ? pedido.dataIda : (pedido.dataVolta as string)

    const voos = ((trecho.Voos ?? []) as Obj[]).filter((v) =>
      ida
        ? casa(pedido.origem, v.Origem) && casa(pedido.destino, v.Destino)
        : casa(pedido.destino, v.Origem) && casa(pedido.origem, v.Destino),
    )
    const dias = diasEntre(brParaISO(trecho.Data), dataAlvo)
    const deslocado = JSON.parse(deslocarDatasTexto(JSON.stringify({ ...trecho, Voos: voos }), dias)) as Obj
    trechos[`${origem}${destino}`] = { ...deslocado, Origem: origem, Destino: destino }
  }

  const internacional = Object.values(trechos).some((t) => (t as Obj).Internacional === 1) ? 1 : 0
  return {
    Busca: montarBusca(pedido, internacional),
    Token: token(pedido),
    Status: original.Status ?? statusOk(),
    Trechos: trechos,
  }
}

/** Resposta de uma rota que o mock não conhece: a API respondeu, mas sem nenhum voo. */
export function respostaVazia(pedido: PedidoCompanhia): Obj {
  const trecho = (origem: string, destino: string, dataISO: string): Obj => ({
    Data: isoParaBR(dataISO),
    Voos: [],
    Origem: origem,
    Semana: {},
    Destino: destino,
    Internacional: 0,
  })
  const trechos: Obj = { [`${pedido.origem}${pedido.destino}`]: trecho(pedido.origem, pedido.destino, pedido.dataIda) }
  if (pedido.dataVolta) {
    trechos[`${pedido.destino}${pedido.origem}`] = trecho(pedido.destino, pedido.origem, pedido.dataVolta)
  }
  return { Busca: montarBusca(pedido, 0), Token: token(pedido), Status: statusOk(), Trechos: trechos }
}
