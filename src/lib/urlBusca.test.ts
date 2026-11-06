import { describe, expect, it } from 'vitest'

import { lerBuscaDaUrl, urlResultados } from './urlBusca'

describe('urlBusca', () => {
  it('ida e volta passam pela URL e voltam iguais', () => {
    const p = { origem: 'GRU', destino: 'LIS', ida: '2027-01-20', volta: '2027-01-27' }
    const url = urlResultados(p)
    expect(url).toBe('/buscar/resultados?origem=GRU&destino=LIS&ida=2027-01-20&volta=2027-01-27')
    expect(lerBuscaDaUrl(new URL(url, 'http://x').searchParams)).toEqual(p)
  })

  it('só ida não leva volta', () => {
    expect(urlResultados({ origem: 'GRU', destino: 'SSA', ida: '2026-12-15', volta: '' })).not.toContain('volta')
  })

  it('recusa busca incompleta ou malformada e ignora volta antes da ida', () => {
    expect(lerBuscaDaUrl(new URLSearchParams('origem=GRU&destino=SSA'))).toBeNull()
    expect(lerBuscaDaUrl(new URLSearchParams('origem=GR&destino=SSA&ida=2026-12-15'))).toBeNull()
    expect(lerBuscaDaUrl(new URLSearchParams('origem=gru&destino=ssa&ida=2026-12-15&volta=2026-12-01'))).toEqual({
      origem: 'GRU',
      destino: 'SSA',
      ida: '2026-12-15',
      volta: '',
    })
  })
})
