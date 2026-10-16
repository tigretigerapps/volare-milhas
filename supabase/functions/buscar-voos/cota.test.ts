import { describe, expect, it } from 'vitest'

import { avaliarDestinos } from './cota.ts'

const hoje = [
  { origem: 'GRU', destino: 'SSA' },
  { origem: 'GRU', destino: 'LIS' },
  { origem: 'GRU', destino: 'SSA' },
]

describe('avaliarDestinos', () => {
  it('conta rotas diferentes, não consultas', () => {
    expect(avaliarDestinos(hoje, { origem: 'GRU', destino: 'REC' }, 5).usados).toBe(2)
  })

  it('libera uma rota nova enquanto houver cota', () => {
    expect(avaliarDestinos(hoje, { origem: 'GRU', destino: 'REC' }, 3).permitido).toBe(true)
  })

  it('bloqueia uma rota nova quando a cota acabou', () => {
    const r = avaliarDestinos(hoje, { origem: 'GRU', destino: 'REC' }, 2)
    expect(r).toEqual({ usados: 2, jaPesquisada: false, permitido: false })
  })

  it('repetir rota já pesquisada não gasta cota, mesmo no limite', () => {
    const r = avaliarDestinos(hoje, { origem: 'GRU', destino: 'LIS' }, 2)
    expect(r).toEqual({ usados: 2, jaPesquisada: true, permitido: true })
  })

  it('a ida e a volta são rotas diferentes', () => {
    expect(avaliarDestinos(hoje, { origem: 'SSA', destino: 'GRU' }, 2).permitido).toBe(false)
  })

  it('sem limite (administrador) sempre libera', () => {
    expect(avaliarDestinos(hoje, { origem: 'GRU', destino: 'REC' }, null).permitido).toBe(true)
  })

  it('limite zero (sem plano) bloqueia tudo que ainda não foi pesquisado', () => {
    expect(avaliarDestinos([], { origem: 'GRU', destino: 'REC' }, 0).permitido).toBe(false)
  })

  it('ignora espaços que o tipo char possa deixar', () => {
    expect(avaliarDestinos([{ origem: 'GRU ', destino: 'SSA ' }], { origem: 'GRU', destino: 'SSA' }, 1).jaPesquisada).toBe(true)
  })
})
