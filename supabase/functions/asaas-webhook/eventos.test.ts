import { describe, expect, it } from 'vitest'

import { decidirCancelamento, efeitoDoEvento, situacaoFinal, somarUmMes } from './eventos.ts'

const pagamento = (event: string, extra: Record<string, unknown> = {}) => ({
  id: 'evt_1',
  event,
  payment: { subscription: 'sub_1', dueDate: '2026-10-21', ...extra },
})

describe('efeitoDoEvento', () => {
  it('pagamento confirmado ou recebido ativa e marca a próxima cobrança', () => {
    for (const e of ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']) {
      expect(efeitoDoEvento(pagamento(e))).toEqual({ assinaturaId: 'sub_1', situacao: 'ativo', proximaCobranca: '2026-11-21' })
    }
  })
  it('cobrança vencida, estornada ou com chargeback deixa inadimplente', () => {
    for (const e of ['PAYMENT_OVERDUE', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED']) {
      expect(efeitoDoEvento(pagamento(e))).toEqual({ assinaturaId: 'sub_1', situacao: 'inadimplente' })
    }
  })
  it('assinatura removida ou inativada cancela', () => {
    for (const e of ['SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED']) {
      expect(efeitoDoEvento({ id: 'e', event: e, subscription: { id: 'sub_9' } })).toEqual({ assinaturaId: 'sub_9', situacao: 'cancelado' })
    }
  })
  it('ignora eventos que não mudam nada e cobranças avulsas (sem assinatura)', () => {
    expect(efeitoDoEvento(pagamento('PAYMENT_CREATED'))).toBeNull()
    expect(efeitoDoEvento(pagamento('PAYMENT_CHECKOUT_VIEWED'))).toBeNull()
    expect(efeitoDoEvento({ id: 'e', event: 'PAYMENT_RECEIVED', payment: {} })).toBeNull()
    expect(efeitoDoEvento({ id: 'e', event: 'SUBSCRIPTION_CREATED', subscription: { id: 's' } })).toBeNull()
  })
  it('sem data de vencimento válida, ativa sem mexer na próxima cobrança', () => {
    expect(efeitoDoEvento(pagamento('PAYMENT_RECEIVED', { dueDate: 'ontem' }))).toEqual({ assinaturaId: 'sub_1', situacao: 'ativo' })
  })
})

describe('somarUmMes', () => {
  it('soma um mês e encolhe o dia quando o mês seguinte é mais curto', () => {
    expect(somarUmMes('2026-10-21')).toBe('2026-11-21')
    expect(somarUmMes('2026-10-31')).toBe('2026-11-30')
    expect(somarUmMes('2026-01-31')).toBe('2026-02-28')
    expect(somarUmMes('2028-01-31')).toBe('2028-02-29')
    expect(somarUmMes('2026-12-15')).toBe('2027-01-15')
  })
})

describe('situacaoFinal', () => {
  it('cobrança vencida depois do cancelamento não desfaz o cancelamento', () => {
    expect(situacaoFinal('cancelado', 'inadimplente')).toBe('cancelado')
  })
  it('um pagamento novo reativa uma assinatura cancelada, e o resto segue o evento', () => {
    expect(situacaoFinal('cancelado', 'ativo')).toBe('ativo')
    expect(situacaoFinal('ativo', 'inadimplente')).toBe('inadimplente')
    expect(situacaoFinal('pendente', 'ativo')).toBe('ativo')
  })
})

describe('decidirCancelamento', () => {
  const hoje = '2026-11-10'
  it('quem pagou o período mantém o acesso até a próxima cobrança', () => {
    expect(decidirCancelamento({ status: 'ativo', proximaCobranca: '2026-11-28', acessoAte: null }, hoje)).toEqual({
      status: 'ativo',
      acessoAte: '2026-11-28',
    })
  })
  it('sem período pago pela frente, cancela na hora', () => {
    expect(decidirCancelamento({ status: 'pendente', proximaCobranca: '2026-11-10', acessoAte: null }, hoje)).toEqual({ status: 'cancelado', acessoAte: null })
    expect(decidirCancelamento({ status: 'ativo', proximaCobranca: '2026-11-01', acessoAte: null }, hoje)).toEqual({ status: 'cancelado', acessoAte: null })
    expect(decidirCancelamento({ status: 'inadimplente', proximaCobranca: '2026-12-01', acessoAte: null }, hoje)).toEqual({ status: 'cancelado', acessoAte: null })
  })
  it('cancelamento já agendado não muda de data', () => {
    expect(decidirCancelamento({ status: 'ativo', proximaCobranca: '2026-12-28', acessoAte: '2026-11-28' }, hoje)).toEqual({
      status: 'ativo',
      acessoAte: '2026-11-28',
    })
    expect(decidirCancelamento({ status: 'ativo', proximaCobranca: '2026-11-01', acessoAte: '2026-11-05' }, hoje)).toEqual({
      status: 'cancelado',
      acessoAte: '2026-11-05',
    })
  })
})
