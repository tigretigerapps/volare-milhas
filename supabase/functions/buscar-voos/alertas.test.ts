import { describe, expect, it } from 'vitest'

import {
  chaveDaOferta,
  datasAmostra,
  deveAlertar,
  melhorAcerto,
  ofertaDoAlerta,
  type OfertaMotor,
  type RotaAlerta,
} from './alertas.ts'

const rota: RotaAlerta = {
  id: 'r1',
  user_id: 'u1',
  origem: 'GRU',
  destino: 'LIS',
  data_inicio: '2026-11-10',
  data_fim: '2026-11-20',
  preco_alvo_milhas: 40000,
  preco_alvo_rs: 2500,
  companhias: ['TAP', 'LATAM'],
}

const oferta = (extra: Partial<OfertaMotor> = {}): OfertaMotor => ({
  origem: 'GRU',
  destino: 'LIS',
  data_voo: '2026-11-12',
  sentido: 'ida',
  companhia: 'TAP',
  programa: 'TAP Miles&Go',
  tipo_milhas: null,
  numero_voo: 'TP82',
  conexoes: 0,
  partida: '2026-11-12 17:25:00',
  chegada: '2026-11-13 06:55:00',
  milhas: 35000,
  taxas_rs: 500,
  valor_dinheiro_rs: 3000,
  ...extra,
})

describe('datasAmostra', () => {
  it('pega início, meio e fim da janela', () => {
    expect(datasAmostra('2026-11-10', '2026-11-20', '2026-10-21')).toEqual(['2026-11-10', '2026-11-15', '2026-11-20'])
  })
  it('ignora dias que já passaram e junta datas repetidas', () => {
    expect(datasAmostra('2026-10-01', '2026-10-23', '2026-10-21')).toEqual(['2026-10-21', '2026-10-22', '2026-10-23'])
    expect(datasAmostra('2026-11-10', '2026-11-10', '2026-10-21')).toEqual(['2026-11-10'])
    expect(datasAmostra('2026-11-10', '2026-11-11', '2026-10-21')).toEqual(['2026-11-10', '2026-11-11'])
  })
  it('devolve vazio quando a janela já acabou', () => {
    expect(datasAmostra('2026-09-01', '2026-10-01', '2026-10-21')).toEqual([])
  })
  it('respeita um máximo menor', () => {
    expect(datasAmostra('2026-11-10', '2026-11-20', '2026-10-21', 1)).toEqual(['2026-11-10'])
    expect(datasAmostra('2026-11-10', '2026-11-20', '2026-10-21', 2)).toEqual(['2026-11-10', '2026-11-20'])
  })
})

describe('melhorAcerto', () => {
  it('acha a oferta em milhas abaixo da meta', () => {
    const a = melhorAcerto(rota, [oferta()])
    expect(a).toMatchObject({ criterio: 'milhas' })
    expect(a?.razao).toBeCloseTo(0.875)
  })
  it('escolhe a de maior folga entre várias e entre os dois critérios', () => {
    const baratoEmReais = oferta({ numero_voo: 'TP1', milhas: 90000, valor_dinheiro_rs: 1000 }) // 0,4 em reais
    const milhasBoas = oferta({ numero_voo: 'TP2', milhas: 30000 }) // 0,75 em milhas
    const a = melhorAcerto(rota, [milhasBoas, baratoEmReais])
    expect(a?.oferta.numero_voo).toBe('TP1')
    expect(a?.criterio).toBe('reais')
  })
  it('ignora o que não bate a meta, volta, outra companhia e datas fora da janela', () => {
    expect(melhorAcerto(rota, [oferta({ milhas: 50000, valor_dinheiro_rs: 4000 })])).toBeNull()
    expect(melhorAcerto(rota, [oferta({ sentido: 'volta' })])).toBeNull()
    expect(melhorAcerto(rota, [oferta({ companhia: 'GOL' })])).toBeNull()
    expect(melhorAcerto(rota, [oferta({ data_voo: '2026-12-01' })])).toBeNull()
  })
  it('sem meta definida em um critério, só vale o outro', () => {
    const soMilhas = { ...rota, preco_alvo_rs: null }
    expect(melhorAcerto(soMilhas, [oferta({ milhas: 99999, valor_dinheiro_rs: 100 })])).toBeNull()
  })
  it('aceita preço exatamente na meta', () => {
    expect(melhorAcerto(rota, [oferta({ milhas: 40000, valor_dinheiro_rs: 9999 })])).not.toBeNull()
  })
})

describe('chaveDaOferta e deveAlertar', () => {
  const acerto = melhorAcerto(rota, [oferta()])!

  it('a chave muda com voo, data e preço', () => {
    const chave = chaveDaOferta('r1', acerto)
    expect(chave).toBe('r1:TAP:TP82:2026-11-12:35000mi')
    expect(chaveDaOferta('r1', melhorAcerto(rota, [oferta({ milhas: 34000 })])!)).not.toBe(chave)
  })

  const agora = new Date('2026-10-21T12:00:00Z')
  const ultimo = (horasAtras: number, milhas: number) => ({
    enviado_em: new Date(agora.getTime() - horasAtras * 3_600_000).toISOString(),
    oferta: { milhas },
  })

  it('avisa quando nunca avisou', () => {
    expect(deveAlertar(null, acerto, agora)).toBe(true)
  })
  it('dentro de 24 horas só avisa se o preço melhorou', () => {
    expect(deveAlertar(ultimo(2, 35000), acerto, agora)).toBe(false)
    expect(deveAlertar(ultimo(2, 36000), acerto, agora)).toBe(true)
    expect(deveAlertar(ultimo(2, 30000), acerto, agora)).toBe(false)
  })
  it('passadas 24 horas avisa de novo', () => {
    expect(deveAlertar(ultimo(25, 35000), acerto, agora)).toBe(true)
  })
  it('grava no alerta os campos que o site lê', () => {
    expect(ofertaDoAlerta(acerto)).toMatchObject({ origem: 'GRU', destino: 'LIS', companhia: 'TAP', programa: 'TAP Miles&Go', milhas: 35000 })
  })
})
