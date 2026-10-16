import { describe, expect, it } from 'vitest'

import {
  duracaoParaMinutos,
  horaDe,
  lerErroFuncao,
  ofertaDoBanco,
  paradasDe,
  rotuloPrograma,
  separarPorSentido,
  type OfertaBanco,
} from './busca'

const linha = (parcial: Partial<OfertaBanco> = {}): OfertaBanco => ({
  id: 'o1',
  busca_id: 'b1',
  origem: 'SAO',
  destino: 'SSA',
  data_voo: '2026-12-15',
  sentido: 'ida',
  companhia: 'GOL',
  programa: 'Smiles',
  numero_voo: 'G31650',
  cabine: 'economica',
  conexoes: 0,
  conexoes_detalhe: [],
  partida: '2026-12-15T07:10:00',
  chegada: '2026-12-15T09:40:00',
  tipo_milhas: 'smiles',
  milhas: 18500,
  taxas_rs: 38.25,
  valor_dinheiro_rs: 528.15,
  criado_em: '2026-10-16T00:00:00Z',
  aeroporto_origem: 'GRU',
  aeroporto_destino: 'SSA',
  duracao: '02:30:00',
  ...parcial,
})

describe('rotuloPrograma', () => {
  it('Smiles e clube aparecem diferentes', () => {
    expect(rotuloPrograma('Smiles', 'smiles', 'GOL')).toBe('Smiles')
    expect(rotuloPrograma('Smiles', 'clube smiles', 'GOL')).toBe('Smiles (clube)')
    expect(rotuloPrograma('Smiles', 'diamante', 'GOL')).toBe('Smiles (diamante)')
  })

  it('tarifa que repete o nome da companhia não acrescenta nada', () => {
    expect(rotuloPrograma('Azul Fidelidade', 'AZUL', 'AZUL')).toBe('Azul Fidelidade')
  })

  it('tarifas da LATAM diferenciam as ofertas do mesmo voo', () => {
    expect(rotuloPrograma('LATAM Pass', 'LIGHT ECONOMY', 'LATAM')).toBe('LATAM Pass (light economy)')
    expect(rotuloPrograma('LATAM Pass', 'PLUS ECONOMY', 'LATAM')).toBe('LATAM Pass (plus economy)')
  })

  it('sem programa usa a companhia; sem tarifa usa só o programa', () => {
    expect(rotuloPrograma(null, null, 'TAP')).toBe('TAP')
    expect(rotuloPrograma('TAP Miles&Go', null, 'TAP')).toBe('TAP Miles&Go')
  })
})

describe('paradasDe', () => {
  const detalhe = [
    { Origem: 'GRU', Destino: 'BSB' },
    { Origem: 'BSB', Destino: 'SSA' },
  ]

  it('direto não tem paradas', () => {
    expect(paradasDe(0, [])).toEqual([])
  })

  it('lista os aeroportos intermediários', () => {
    expect(paradasDe(1, detalhe)).toEqual(['BSB'])
  })

  it('sem detalhe coerente, só conta as paradas', () => {
    expect(paradasDe(2, detalhe)).toEqual(['', ''])
    expect(paradasDe(1, null)).toEqual([''])
  })
})

describe('duracaoParaMinutos', () => {
  it('lê o formato de interval do Postgres', () => {
    expect(duracaoParaMinutos('02:30:00')).toBe(150)
    expect(duracaoParaMinutos('04:50')).toBe(290)
    expect(duracaoParaMinutos('1 day 02:00:00')).toBe(1560)
  })

  it('devolve null para o que não entende', () => {
    expect(duracaoParaMinutos(null)).toBeNull()
    expect(duracaoParaMinutos('duas horas')).toBeNull()
  })
})

describe('ofertaDoBanco', () => {
  it('converte a linha do banco na linha da tela', () => {
    expect(ofertaDoBanco(linha())).toEqual({
      id: 'o1',
      programa: 'Smiles',
      voo: 'G31650',
      origem: 'GRU',
      destino: 'SSA',
      partida: '07:10',
      chegada: '09:40',
      paradas: [],
      duracaoMinutos: 150,
      dinheiro: 528.15,
      milhas: 18500,
      taxas: 38.25,
      sentido: 'ida',
      dataVoo: '2026-12-15',
    })
  })

  it('usa o aeroporto do voo, não o código de cidade da busca', () => {
    const o = ofertaDoBanco(linha({ aeroporto_origem: 'VCP' }))
    expect(o?.origem).toBe('VCP')
    expect(ofertaDoBanco(linha({ aeroporto_origem: null }))?.origem).toBe('SAO')
  })

  it('mostra a volta como volta', () => {
    expect(ofertaDoBanco(linha({ sentido: 'volta' }))?.sentido).toBe('volta')
  })

  it('sem milhas ou sem preço em dinheiro não há comparação', () => {
    expect(ofertaDoBanco(linha({ milhas: null }))).toBeNull()
    expect(ofertaDoBanco(linha({ valor_dinheiro_rs: null }))).toBeNull()
  })

  it('sem a duração do banco, calcula pelos horários', () => {
    expect(ofertaDoBanco(linha({ duracao: null }))?.duracaoMinutos).toBe(150)
  })

  it('taxas nulas viram zero', () => {
    expect(ofertaDoBanco(linha({ taxas_rs: null }))?.taxas).toBe(0)
  })
})

describe('horaDe e separarPorSentido', () => {
  it('extrai HH:MM', () => {
    expect(horaDe('2026-12-15T23:05:00')).toBe('23:05')
  })

  it('separa ida e volta', () => {
    const ofertas = [
      { id: 'a', sentido: 'ida' },
      { id: 'b', sentido: 'volta' },
      { id: 'c' },
    ] as never
    const r = separarPorSentido(ofertas)
    expect(r.ida.map((o) => o.id)).toEqual(['a', 'c'])
    expect(r.volta.map((o) => o.id)).toEqual(['b'])
  })
})

describe('lerErroFuncao', () => {
  const erroHttp = (corpo: unknown, status = 429) => ({
    name: 'FunctionsHttpError',
    context: new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status }),
  })

  it('devolve a mensagem em português da função, com o uso', async () => {
    const r = await lerErroFuncao(
      erroHttp({
        codigo: 'limite_destinos',
        mensagem: 'Você já pesquisou 10 destinos.',
        uso: { destinos_usados: 10, destinos_limite: 10 },
      }),
    )
    expect(r).toEqual({
      codigo: 'limite_destinos',
      mensagem: 'Você já pesquisou 10 destinos.',
      uso: { destinos_usados: 10, destinos_limite: 10 },
    })
  })

  it('sem internet', async () => {
    const r = await lerErroFuncao({ name: 'FunctionsFetchError' })
    expect(r.codigo).toBe('sem_conexao')
  })

  it('corpo ilegível ou erro desconhecido cai na mensagem genérica', async () => {
    expect((await lerErroFuncao(erroHttp('<html>erro</html>', 500))).mensagem).toMatch(/Tente de novo/)
    expect((await lerErroFuncao(new Error('x'))).codigo).toBe('erro')
    expect((await lerErroFuncao(null)).codigo).toBe('erro')
  })
})
