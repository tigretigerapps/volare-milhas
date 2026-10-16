import { describe, expect, it } from 'vitest'

import {
  formatarDuracao,
  formatarMilheiro,
  formatarMilhas,
  formatarParadas,
  formatarReais,
  formatarReaisComCentavos,
} from './formato'

const nbsp = ' '

describe('formato', () => {
  it('reais arredondados, com espaço inseparável', () => {
    expect(formatarReais(528.15)).toBe(`R$${nbsp}528`)
    expect(formatarReais(119.9)).toBe(`R$${nbsp}120`)
    expect(formatarReais(1234)).toBe(`R$${nbsp}1.234`)
  })

  it('reais com centavos', () => {
    expect(formatarReaisComCentavos(20)).toBe(`R$${nbsp}20,00`)
  })

  it('milheiro sem centavos quando inteiro', () => {
    expect(formatarMilheiro(20)).toBe(`R$${nbsp}20`)
    expect(formatarMilheiro(17.5)).toBe(`R$${nbsp}17,50`)
  })

  it('milhas com separador de milhar', () => {
    expect(formatarMilhas(18500)).toBe('18.500')
  })

  it('duração', () => {
    expect(formatarDuracao(150)).toBe('2h30')
    expect(formatarDuracao(290)).toBe('4h50')
    expect(formatarDuracao(60)).toBe('1h')
    expect(formatarDuracao(65)).toBe('1h05')
    expect(formatarDuracao(45)).toBe('45min')
  })

  it('paradas', () => {
    expect(formatarParadas([])).toBe('direto')
    expect(formatarParadas(['BSB'])).toBe('1 parada em BSB')
    expect(formatarParadas(['BSB', 'REC'])).toBe('2 paradas em BSB e REC')
    expect(formatarParadas([''])).toBe('1 parada')
  })
})
