import { describe, expect, it } from 'vitest'

import { interpretarMilheiro, milheiroParaCampo } from './milheiro'

describe('interpretarMilheiro', () => {
  it('aceita inteiros e centavos com vírgula', () => {
    expect(interpretarMilheiro('20')).toBe(20)
    expect(interpretarMilheiro('20,5')).toBe(20.5)
    expect(interpretarMilheiro('17,50')).toBe(17.5)
  })

  it('aceita separador de milhar e prefixo R$', () => {
    expect(interpretarMilheiro('1.020,00')).toBe(1020)
    expect(interpretarMilheiro('R$ 22,00')).toBe(22)
  })

  it('recusa vazio, zero, negativo e texto', () => {
    expect(interpretarMilheiro('')).toBeNull()
    expect(interpretarMilheiro('0')).toBeNull()
    expect(interpretarMilheiro('0,00')).toBeNull()
    expect(interpretarMilheiro('-20')).toBeNull()
    expect(interpretarMilheiro('vinte')).toBeNull()
    expect(interpretarMilheiro('20,555')).toBeNull()
  })
})

describe('milheiroParaCampo', () => {
  it('formata com duas casas e vírgula', () => {
    expect(milheiroParaCampo(20)).toBe('20,00')
    expect(milheiroParaCampo(17.5)).toBe('17,50')
  })
})
