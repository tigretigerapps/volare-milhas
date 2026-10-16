import { describe, expect, it } from 'vitest'

import {
  alertaRecente,
  contarNaoVistos,
  detalheAlerta,
  lerOfertaDoAlerta,
  montarAlerta,
  prepararAlertas,
  type AlertaPrecoAlvo,
  type LinhaAlerta,
} from './alertas'

const nbsp = ' '

const rotaLisboa = { origem: 'GRU', destino: 'LIS', preco_alvo_milhas: 40000, preco_alvo_rs: null }

const linha = (parcial: Partial<LinhaAlerta> = {}): LinhaAlerta => ({
  id: 'a1',
  enviado_em: '2026-10-15T12:00:00Z',
  oferta_chave: 'TAP-GRU-LIS-2026-12-05-35000',
  oferta: { programa: 'TAP Miles&Go', milhas: 35000, valor_dinheiro_rs: 4100 },
  rotas_salvas: rotaLisboa,
  ...parcial,
})

describe('lerOfertaDoAlerta', () => {
  it('lê os campos conhecidos', () => {
    expect(lerOfertaDoAlerta({ origem: 'gru', destino: 'lis', programa: 'TAP Miles&Go', milhas: 35000, valor_dinheiro_rs: 4100 })).toEqual({
      origem: 'GRU',
      destino: 'LIS',
      programa: 'TAP Miles&Go',
      milhas: 35000,
      valorReais: 4100,
    })
  })

  it('cai para companhia quando não há programa', () => {
    expect(lerOfertaDoAlerta({ companhia: 'TAP' }).programa).toBe('TAP')
  })

  it('ignora formatos inesperados sem quebrar', () => {
    const vazio = { origem: null, destino: null, programa: null, milhas: null, valorReais: null }
    expect(lerOfertaDoAlerta(null)).toEqual(vazio)
    expect(lerOfertaDoAlerta('texto')).toEqual(vazio)
    expect(lerOfertaDoAlerta([1, 2])).toEqual(vazio)
    expect(lerOfertaDoAlerta({ milhas: '35000', valor_dinheiro_rs: -1 })).toEqual(vazio)
  })
})

describe('montarAlerta', () => {
  it('usa a rota salva para trecho e meta', () => {
    expect(montarAlerta(linha())).toMatchObject({
      origem: 'GRU',
      destino: 'LIS',
      programa: 'TAP Miles&Go',
      milhas: 35000,
      metaMilhas: 40000,
    })
  })

  it('sem rota (excluída), usa o trecho gravado na oferta', () => {
    const a = montarAlerta(linha({ rotas_salvas: null, oferta: { origem: 'GRU', destino: 'LIS', milhas: 35000 } }))
    expect(a).toMatchObject({ origem: 'GRU', destino: 'LIS', metaMilhas: null })
  })

  it('descarta o alerta se não der para saber o trecho', () => {
    expect(montarAlerta(linha({ rotas_salvas: null, oferta: {} }))).toBeNull()
  })
})

describe('prepararAlertas', () => {
  it('ordena do mais novo ao mais antigo', () => {
    const r = prepararAlertas([
      linha({ id: 'antigo', oferta_chave: 'k1', enviado_em: '2026-10-01T00:00:00Z' }),
      linha({ id: 'novo', oferta_chave: 'k2', enviado_em: '2026-10-10T00:00:00Z' }),
    ])
    expect(r.map((a) => a.id)).toEqual(['novo', 'antigo'])
  })

  it('a mesma oferta em vários canais conta uma vez, pelo envio mais novo', () => {
    const r = prepararAlertas([
      linha({ id: 'email', enviado_em: '2026-10-15T12:00:05Z' }),
      linha({ id: 'whatsapp', enviado_em: '2026-10-15T12:00:00Z' }),
    ])
    expect(r.map((a) => a.id)).toEqual(['email'])
  })
})

describe('contarNaoVistos', () => {
  const alertas = prepararAlertas([
    linha({ id: 'a', oferta_chave: 'a', enviado_em: '2026-10-15T10:00:00Z' }),
    linha({ id: 'b', oferta_chave: 'b', enviado_em: '2026-10-14T10:00:00Z' }),
  ])

  it('sem registro de visita, todos são novos', () => {
    expect(contarNaoVistos(alertas, null)).toBe(2)
  })

  it('conta só os que chegaram depois da última visita', () => {
    expect(contarNaoVistos(alertas, '2026-10-15T00:00:00Z')).toBe(1)
    expect(contarNaoVistos(alertas, '2026-10-15T10:00:00Z')).toBe(0)
  })

  it('sem alertas, zero', () => {
    expect(contarNaoVistos([], null)).toBe(0)
  })
})

describe('alertaRecente', () => {
  const alertas = prepararAlertas([linha({ enviado_em: '2026-10-10T12:00:00Z' })])

  it('mostra o mais novo dentro da janela', () => {
    expect(alertaRecente(alertas, new Date('2026-10-16T12:00:00Z'))?.id).toBe('a1')
  })

  it('esconde quando passou da janela', () => {
    expect(alertaRecente(alertas, new Date('2026-10-30T12:00:00Z'))).toBeNull()
  })

  it('sem alertas, nada', () => {
    expect(alertaRecente([], new Date())).toBeNull()
  })
})

describe('detalheAlerta', () => {
  const base = montarAlerta(linha()) as AlertaPrecoAlvo

  it('milhas com programa e meta', () => {
    expect(detalheAlerta(base)).toBe('35.000 milhas na TAP Miles&Go, sua meta era 40.000.')
  })

  it('em reais quando o alerta não traz milhas', () => {
    const a = { ...base, milhas: null, valorReais: 2300, metaMilhas: null, metaReais: 2500 }
    expect(detalheAlerta(a)).toBe(`R$${nbsp}2.300 na TAP Miles&Go, sua meta era R$${nbsp}2.500.`)
  })

  it('omite o que não foi informado', () => {
    expect(detalheAlerta({ ...base, programa: null, metaMilhas: null })).toBe('35.000 milhas.')
  })

  it('sem preço nenhum, não inventa', () => {
    expect(detalheAlerta({ ...base, milhas: null, valorReais: null })).toBeNull()
  })
})
