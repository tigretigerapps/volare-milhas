import { describe, expect, it } from 'vitest'

import {
  brParaISO,
  dataISOValida,
  deslocarDatasTexto,
  diasEntre,
  hojeSaoPaulo,
  inicioDoDiaSaoPaulo,
  isoParaBR,
} from './datas.ts'

describe('datas', () => {
  it('converte entre BR e ISO', () => {
    expect(brParaISO('15/12/2026')).toBe('2026-12-15')
    expect(isoParaBR('2026-12-15')).toBe('15/12/2026')
  })

  it('só aceita datas reais', () => {
    expect(dataISOValida('2026-12-15')).toBe(true)
    expect(dataISOValida('2026-02-30')).toBe(false)
    expect(dataISOValida('15/12/2026')).toBe(false)
    expect(dataISOValida(20261215)).toBe(false)
    expect(dataISOValida(undefined)).toBe(false)
  })

  it('conta dias, inclusive entre anos', () => {
    expect(diasEntre('2026-12-15', '2026-12-20')).toBe(5)
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3)
    expect(diasEntre('2026-12-15', '2026-12-10')).toBe(-5)
  })

  it('desloca todas as datas do texto, com e sem horário', () => {
    const texto = '{"Data":"15/12/2026","Embarque":"15/12/2026 23:30","Desembarque":"16/12/2026 01:10","Duracao":"01:40"}'
    expect(deslocarDatasTexto(texto, 20)).toBe(
      '{"Data":"04/01/2027","Embarque":"04/01/2027 23:30","Desembarque":"05/01/2027 01:10","Duracao":"01:40"}',
    )
    expect(deslocarDatasTexto('01/03/2027', -1)).toBe('28/02/2027')
  })

  it('usa o dia de São Paulo, não o de Greenwich', () => {
    // 01:30 UTC de 16/10 ainda é 22:30 de 15/10 em São Paulo.
    const agora = new Date('2026-10-16T01:30:00Z')
    expect(hojeSaoPaulo(agora)).toBe('2026-10-15')
    expect(inicioDoDiaSaoPaulo(agora)).toBe('2026-10-15T00:00:00-03:00')
    expect(Date.parse(inicioDoDiaSaoPaulo(agora))).toBe(Date.parse('2026-10-15T03:00:00Z'))
  })
})
