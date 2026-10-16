import { describe, expect, it } from 'vitest'

import { MAX_COMPANHIAS, validarPedido } from './validacao.ts'

const hoje = '2026-10-16'
const base = { origem: 'gru', destino: 'ssa', dataIda: '2026-12-15', dataVolta: null, companhias: ['gol', 'azul'] }

describe('validarPedido', () => {
  it('normaliza um pedido válido', () => {
    expect(validarPedido(base, hoje)).toEqual({
      ok: true,
      pedido: { origem: 'GRU', destino: 'SSA', dataIda: '2026-12-15', dataVolta: null, companhias: ['GOL', 'AZUL'] },
    })
  })

  it('aceita volta vazia como só ida e volta válida como ida e volta', () => {
    const vazia = validarPedido({ ...base, dataVolta: '' }, hoje)
    expect(vazia.ok && vazia.pedido.dataVolta).toBeNull()
    const com = validarPedido({ ...base, dataVolta: '2026-12-22' }, hoje)
    expect(com.ok && com.pedido.dataVolta).toBe('2026-12-22')
  })

  it('aceita ida hoje e remove companhias repetidas', () => {
    const r = validarPedido({ ...base, dataIda: hoje, companhias: ['GOL', 'gol'] }, hoje)
    expect(r.ok && r.pedido.companhias).toEqual(['GOL'])
  })

  it.each([
    ['corpo vazio', null],
    ['origem curta', { ...base, origem: 'GR' }],
    ['destino com número', { ...base, destino: 'SS1' }],
    ['mesma origem e destino', { ...base, destino: 'GRU' }],
    ['ida inválida', { ...base, dataIda: '2026-02-30' }],
    ['ida no passado', { ...base, dataIda: '2026-10-15' }],
    ['volta inválida', { ...base, dataVolta: 'amanhã' }],
    ['volta antes da ida', { ...base, dataVolta: '2026-12-10' }],
    ['sem companhias', { ...base, companhias: [] }],
    ['companhias fora da lista', { ...base, companhias: ['GOL', 'VOEPASS'] }],
    ['companhias demais', { ...base, companhias: ['GOL', 'AZUL', 'LATAM', 'TAP', 'IBERIA'] }],
  ])('recusa: %s', (_nome, corpo) => {
    const r = validarPedido(corpo, hoje)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.erro.codigo).toBe('pedido_invalido')
  })

  it('o limite de companhias é o declarado', () => {
    expect(MAX_COMPANHIAS).toBe(4)
  })
})
