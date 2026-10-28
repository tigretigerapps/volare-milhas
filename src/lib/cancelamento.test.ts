import { describe, expect, it } from 'vitest'

import { dataBR, situacaoDaAssinatura } from './cancelamento'

describe('cancelamento', () => {
  it('formata a data', () => {
    expect(dataBR('2026-11-28')).toBe('28/11/2026')
  })
  it('distingue renovando, cancelada com acesso e as demais', () => {
    expect(situacaoDaAssinatura({ status: 'ativo', proxima_cobranca: '2026-11-28', acesso_ate: null })).toEqual({ tipo: 'ativa', renovaEm: '2026-11-28' })
    expect(situacaoDaAssinatura({ status: 'ativo', proxima_cobranca: '2026-11-28', acesso_ate: '2026-11-28' })).toEqual({ tipo: 'cancelada', acessoAte: '2026-11-28' })
    expect(situacaoDaAssinatura({ status: 'pendente', proxima_cobranca: null, acesso_ate: null })).toEqual({ tipo: 'outra' })
    expect(situacaoDaAssinatura({ status: 'cancelado', proxima_cobranca: null, acesso_ate: '2026-10-01' })).toEqual({ tipo: 'outra' })
    expect(situacaoDaAssinatura(null)).toEqual({ tipo: 'outra' })
  })
})
