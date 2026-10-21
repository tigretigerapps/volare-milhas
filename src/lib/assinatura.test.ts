import { describe, expect, it } from 'vitest'

import { documentoCompleto, formatarCpfCnpj } from './assinatura'

describe('assinatura', () => {
  it('formata CPF e CNPJ enquanto digita', () => {
    expect(formatarCpfCnpj('529')).toBe('529')
    expect(formatarCpfCnpj('5299')).toBe('529.9')
    expect(formatarCpfCnpj('52998224725')).toBe('529.982.247-25')
    expect(formatarCpfCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatarCpfCnpj('529.982.247-25999')).toBe('52.998.224/7259-99')
    expect(formatarCpfCnpj('529982247259999999')).toBe('52.998.224/7259-99')
  })
  it('só considera completo com 11 ou 14 números', () => {
    expect(documentoCompleto('529.982.247-25')).toBe(true)
    expect(documentoCompleto('11.222.333/0001-81')).toBe(true)
    expect(documentoCompleto('12345')).toBe(false)
  })
})
