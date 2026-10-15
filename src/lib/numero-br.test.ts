import { describe, expect, it } from 'vitest'

import { interpretarDecimalBR, interpretarInteiroBR } from './numero-br'

describe('interpretarDecimalBR', () => {
  it('aceita centavos, milhar e prefixo', () => {
    expect(interpretarDecimalBR('2.500,00')).toBe(2500)
    expect(interpretarDecimalBR('2500')).toBe(2500)
    expect(interpretarDecimalBR('R$ 99,9')).toBe(99.9)
  })

  it('recusa formatos ambíguos ou inválidos', () => {
    expect(interpretarDecimalBR('2.50')).toBeNull()
    expect(interpretarDecimalBR('1,000.00')).toBeNull()
    expect(interpretarDecimalBR('')).toBeNull()
  })
})

describe('interpretarInteiroBR', () => {
  it('aceita com e sem separador de milhar', () => {
    expect(interpretarInteiroBR('40.000')).toBe(40000)
    expect(interpretarInteiroBR('40000')).toBe(40000)
  })

  it('recusa decimais, zero e texto', () => {
    expect(interpretarInteiroBR('40.000,5')).toBeNull()
    expect(interpretarInteiroBR('0')).toBeNull()
    expect(interpretarInteiroBR('40 mil')).toBeNull()
    expect(interpretarInteiroBR('4.00')).toBeNull()
  })
})
