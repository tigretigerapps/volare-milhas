import { describe, expect, it } from 'vitest'

import { casa, equivalentes } from './aeroportos.ts'
import { adaptarRespostaMock, escolherMock, respostaVazia } from './mock.ts'
import type { LinhaMock, Obj, PedidoCompanhia } from './tipos.ts'

const voo = (extra: Obj): Obj => ({
  Valor: [{ Executivo: false, TipoValor: 'PO', TotalAdulto: 528.15, TaxaEmbarque: 38.25 }],
  Milhas: [{ Executivo: false, TipoMilhas: 'smiles', Adulto: 18500, TaxaEmbarque: 38.25 }],
  Duracao: '02:30',
  Conexoes: [],
  NumeroConexoes: 0,
  Companhia: 'GOL',
  ...extra,
})

const trecho = (origem: string, destino: string, data: string, voos: Obj[]): Obj => ({
  Data: data,
  Voos: voos,
  Origem: origem,
  Semana: {},
  Destino: destino,
  Internacional: 0,
})

const resposta = (trechos: Obj): Obj => ({
  Busca: { Chave: 'XXXX', Senha: 'XXXX', Trechos: [] },
  Token: 'x',
  Status: { Erro: false, Alerta: [], Sucesso: true },
  Trechos: trechos,
})

const linha = (parcial: Partial<LinhaMock> & { response_json: Obj }): LinhaMock => ({
  origem: 'SAO',
  destino: 'SSA',
  data_voo: '2026-12-15',
  data_volta: null,
  companhia: 'GOL',
  ...parcial,
})

// SAO→SSA, só ida, com um voo que sai de GRU, outro de VCP e uma chegada no dia seguinte.
const somenteIda = linha({
  response_json: resposta({
    SAOSSA: trecho('SAO', 'SSA', '15/12/2026', [
      voo({ NumeroVoo: 'G31650', Origem: 'GRU', Destino: 'SSA', Sentido: 'ida', Embarque: '15/12/2026 07:10', Desembarque: '15/12/2026 09:40' }),
      voo({ NumeroVoo: 'AD4510', Origem: 'VCP', Destino: 'SSA', Sentido: 'ida', Embarque: '15/12/2026 23:30', Desembarque: '16/12/2026 02:00' }),
    ]),
  }),
})

// SAO→SSA ida e volta.
const idaEVolta = linha({
  data_volta: '2026-12-22',
  response_json: resposta({
    SAOSSA: trecho('SAO', 'SSA', '15/12/2026', [
      voo({ NumeroVoo: 'G31650', Origem: 'GRU', Destino: 'SSA', Sentido: 'ida', Embarque: '15/12/2026 07:10', Desembarque: '15/12/2026 09:40' }),
    ]),
    SSASAO: trecho('SSA', 'SAO', '22/12/2026', [
      voo({ NumeroVoo: 'G31651', Origem: 'SSA', Destino: 'GRU', Sentido: 'volta', Embarque: '22/12/2026 11:20', Desembarque: '22/12/2026 14:00' }),
    ]),
  }),
})

const pedido = (extra: Partial<PedidoCompanhia> = {}): PedidoCompanhia => ({
  origem: 'GRU',
  destino: 'SSA',
  dataIda: '2027-01-10',
  dataVolta: null,
  companhia: 'GOL',
  ...extra,
})

describe('aeroportos e cidades', () => {
  it('equivalentes vale nos dois sentidos', () => {
    expect(equivalentes('SAO')).toEqual(new Set(['SAO', 'GRU', 'CGH', 'VCP']))
    expect(equivalentes('GRU')).toEqual(new Set(['GRU', 'SAO']))
    expect(equivalentes('SSA')).toEqual(new Set(['SSA']))
  })

  it('pedido por aeroporto casa só com aquele aeroporto; por cidade, com todos', () => {
    expect(casa('GRU', 'GRU')).toBe(true)
    expect(casa('GRU', 'VCP')).toBe(false)
    expect(casa('SAO', 'VCP')).toBe(true)
    expect(casa('SSA', 'SSA')).toBe(true)
  })
})

describe('escolherMock', () => {
  it('acha o mock da cidade quando se pede o aeroporto', () => {
    expect(escolherMock([somenteIda], pedido())).toBe(somenteIda)
  })

  it('não mistura companhias nem rotas', () => {
    expect(escolherMock([somenteIda], pedido({ companhia: 'AZUL' }))).toBeNull()
    expect(escolherMock([somenteIda], pedido({ destino: 'REC' }))).toBeNull()
  })

  it('prefere o mesmo tipo de viagem', () => {
    expect(escolherMock([somenteIda, idaEVolta], pedido({ dataVolta: '2027-01-17' }))).toBe(idaEVolta)
    expect(escolherMock([somenteIda, idaEVolta], pedido())).toBe(somenteIda)
  })

  it('cai no outro tipo quando só ele existe', () => {
    expect(escolherMock([idaEVolta], pedido())).toBe(idaEVolta)
  })

  it('entre iguais, escolhe a data mais próxima', () => {
    const perto = linha({ data_voo: '2027-01-05', response_json: somenteIda.response_json })
    expect(escolherMock([somenteIda, perto], pedido())).toBe(perto)
  })
})

describe('adaptarRespostaMock', () => {
  it('pedido por aeroporto traz só os voos daquele aeroporto, com o trecho renomeado', () => {
    const r = adaptarRespostaMock(somenteIda, pedido())
    expect(Object.keys(r.Trechos)).toEqual(['GRUSSA'])
    expect(r.Trechos.GRUSSA.Origem).toBe('GRU')
    expect(r.Trechos.GRUSSA.Voos.map((v: Obj) => v.NumeroVoo)).toEqual(['G31650'])
  })

  it('pedido por cidade mantém todos os aeroportos', () => {
    const r = adaptarRespostaMock(somenteIda, pedido({ origem: 'SAO' }))
    expect(r.Trechos.SAOSSA.Voos.map((v: Obj) => v.NumeroVoo)).toEqual(['G31650', 'AD4510'])
  })

  it('um aeroporto sem voo no mock devolve o trecho vazio, como a API faria', () => {
    const r = adaptarRespostaMock(somenteIda, pedido({ origem: 'CGH' }))
    expect(r.Trechos.CGHSSA.Voos).toEqual([])
  })

  it('desloca as datas para a data pedida, inclusive chegada no dia seguinte', () => {
    const r = adaptarRespostaMock(somenteIda, pedido({ origem: 'SAO' }))
    const t = r.Trechos.SAOSSA
    expect(t.Data).toBe('10/01/2027')
    expect(t.Voos[0].Embarque).toBe('10/01/2027 07:10')
    expect(t.Voos[1].Embarque).toBe('10/01/2027 23:30')
    expect(t.Voos[1].Desembarque).toBe('11/01/2027 02:00')
  })

  it('só ida descarta o trecho de volta do mock', () => {
    const r = adaptarRespostaMock(idaEVolta, pedido())
    expect(Object.keys(r.Trechos)).toEqual(['GRUSSA'])
  })

  it('ida e volta desloca cada trecho para a sua data', () => {
    const r = adaptarRespostaMock(idaEVolta, pedido({ dataVolta: '2027-01-30' }))
    expect(Object.keys(r.Trechos)).toEqual(['GRUSSA', 'SSAGRU'])
    expect(r.Trechos.GRUSSA.Voos[0].Embarque).toBe('10/01/2027 07:10')
    expect(r.Trechos.SSAGRU.Data).toBe('30/01/2027')
    expect(r.Trechos.SSAGRU.Voos[0].Embarque).toBe('30/01/2027 11:20')
    expect(r.Trechos.SSAGRU.Voos[0].Destino).toBe('GRU')
  })

  it('desloca também as datas das conexões', () => {
    const comConexao = linha({
      companhia: 'LATAM',
      response_json: resposta({
        SAOSSA: trecho('SAO', 'SSA', '15/12/2026', [
          voo({
            NumeroVoo: 'LA3320',
            Origem: 'GRU',
            Destino: 'SSA',
            Sentido: 'ida',
            NumeroConexoes: 1,
            Embarque: '15/12/2026 10:15',
            Desembarque: '15/12/2026 15:05',
            Conexoes: [
              { Origem: 'GRU', Destino: 'BSB', Embarque: '15/12/2026 10:15', Desembarque: '15/12/2026 11:55' },
              { Origem: 'BSB', Destino: 'SSA', Embarque: '15/12/2026 13:00', Desembarque: '15/12/2026 15:05' },
            ],
          }),
        ]),
      }),
    })
    const r = adaptarRespostaMock(comConexao, pedido({ companhia: 'LATAM' }))
    expect(r.Trechos.GRUSSA.Voos[0].Conexoes[1].Embarque).toBe('10/01/2027 13:00')
  })

  it('não altera o mock original', () => {
    const antes = JSON.stringify(somenteIda)
    adaptarRespostaMock(somenteIda, pedido())
    expect(JSON.stringify(somenteIda)).toBe(antes)
  })

  it('reescreve a Busca com o pedido e nunca com credenciais reais', () => {
    const { Busca } = adaptarRespostaMock(idaEVolta, pedido({ dataVolta: '2027-01-30' }))
    expect(Busca.Chave).toBe('XXXX')
    expect(Busca.Senha).toBe('XXXX')
    expect(Busca.TipoViagem).toBe(1)
    expect(Busca.Companhias).toEqual(['GOL'])
    expect(Busca.Trechos[0]).toEqual({ Origem: 'GRU', DataIda: '10/01/2027', Destino: 'SSA', DataVolta: '30/01/2027' })
  })

  it('mantém o Status de erro da fonte', () => {
    const comErro = linha({ response_json: { Busca: {}, Status: { Erro: true, Sucesso: false, Alerta: ['falha'] } } })
    const r = adaptarRespostaMock(comErro, pedido())
    expect(r.Status.Erro).toBe(true)
    expect(r.Trechos).toEqual({})
  })
})

describe('respostaVazia', () => {
  it('só ida: um trecho sem voos', () => {
    const r = respostaVazia(pedido())
    expect(r.Status.Erro).toBe(false)
    expect(r.Trechos.GRUSSA).toMatchObject({ Data: '10/01/2027', Voos: [] })
  })

  it('ida e volta: dois trechos sem voos', () => {
    const r = respostaVazia(pedido({ dataVolta: '2027-01-17' }))
    expect(Object.keys(r.Trechos)).toEqual(['GRUSSA', 'SSAGRU'])
    expect(r.Trechos.SSAGRU.Data).toBe('17/01/2027')
  })
})
