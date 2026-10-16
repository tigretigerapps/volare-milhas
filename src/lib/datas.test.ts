import { describe, expect, it } from 'vitest'

import { hojeISO, somarDiasISO } from './datas'

describe('datas', () => {
  it('hoje em formato ISO local', () => {
    expect(hojeISO(new Date(2026, 9, 5))).toBe('2026-10-05')
  })

  it('soma dias atravessando mês e ano', () => {
    expect(somarDiasISO('2026-10-16', 30)).toBe('2026-11-15')
    expect(somarDiasISO('2026-12-20', 20)).toBe('2027-01-09')
    expect(somarDiasISO('2026-03-01', -1)).toBe('2026-02-28')
  })
})
