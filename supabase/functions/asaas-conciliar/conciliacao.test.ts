import { describe, expect, it } from 'vitest'

import { decidirCancelamento, decidirConciliacao, somarUmMes } from './conciliacao.ts'

const hoje = '2026-11-10'
const ativaNoAsaas = { status: 'ACTIVE', deleted: false }
const encerradaNoAsaas = { status: 'INACTIVE', deleted: true }
const c = (status: string, dueDate = '2026-11-01') => ({ status, dueDate })

describe('decidirConciliacao', () => {
  it('não mexe quando o que temos bate com o Asaas', () => {
    expect(decidirConciliacao({ status: 'ativo', acessoAte: null, proximaCobranca: '2026-12-01' }, ativaNoAsaas, [c('RECEIVED')], hoje)).toBeNull()
    expect(decidirConciliacao({ status: 'pendente', acessoAte: null, proximaCobranca: hoje }, ativaNoAsaas, [c('PENDING')], hoje)).toBeNull()
  })

  it('cancelada no Asaas: mantém o acesso até o fim do período pago', () => {
    expect(decidirConciliacao({ status: 'ativo', acessoAte: null, proximaCobranca: '2026-11-28' }, encerradaNoAsaas, [c('RECEIVED')], hoje)).toEqual({
      status: 'ativo',
      acesso_ate: '2026-11-28',
      motivo: 'Cancelada no Asaas.',
    })
  })
  it('cancelada no Asaas sem período pago pela frente: cancela na hora', () => {
    expect(decidirConciliacao({ status: 'pendente', acessoAte: null, proximaCobranca: hoje }, encerradaNoAsaas, [], hoje)).toEqual({
      status: 'cancelado',
      acesso_ate: null,
      motivo: 'Cancelada no Asaas.',
    })
  })
  it('cancelamento já agendado e correto não gera correção', () => {
    expect(decidirConciliacao({ status: 'ativo', acessoAte: '2026-11-28', proximaCobranca: '2026-11-28' }, encerradaNoAsaas, [c('RECEIVED')], hoje)).toBeNull()
  })
  it('cancelamento agendado que já venceu passa a cancelado', () => {
    expect(decidirConciliacao({ status: 'ativo', acessoAte: '2026-11-05', proximaCobranca: '2026-11-05' }, encerradaNoAsaas, [c('RECEIVED')], hoje)).toMatchObject({
      status: 'cancelado',
    })
  })

  it('paga no Asaas mas pendente ou inadimplente aqui: ativa e marca a próxima cobrança', () => {
    for (const status of ['pendente', 'inadimplente']) {
      expect(decidirConciliacao({ status, acessoAte: null, proximaCobranca: null }, ativaNoAsaas, [c('RECEIVED', '2026-10-31')], hoje)).toEqual({
        status: 'ativo',
        proxima_cobranca: '2026-11-30',
        motivo: 'Paga no Asaas.',
      })
    }
  })
  it('com cobrança ainda em aberto, não ativa', () => {
    expect(decidirConciliacao({ status: 'pendente', acessoAte: null, proximaCobranca: null }, ativaNoAsaas, [c('RECEIVED'), c('PENDING')], hoje)).toBeNull()
  })

  it('cobrança vencida no Asaas com assinatura ativa aqui: vira inadimplente', () => {
    expect(decidirConciliacao({ status: 'ativo', acessoAte: null, proximaCobranca: '2026-11-01' }, ativaNoAsaas, [c('OVERDUE')], hoje)).toEqual({
      status: 'inadimplente',
      motivo: 'Cobrança vencida no Asaas.',
    })
  })

  it('ignora assinaturas já canceladas aqui', () => {
    expect(decidirConciliacao({ status: 'cancelado', acessoAte: null, proximaCobranca: null }, ativaNoAsaas, [c('RECEIVED')], hoje)).toBeNull()
  })
})

describe('regras auxiliares', () => {
  it('decide o cancelamento e soma um mês', () => {
    expect(decidirCancelamento({ status: 'ativo', acessoAte: null, proximaCobranca: '2026-11-28' }, hoje)).toEqual({ status: 'ativo', acessoAte: '2026-11-28' })
    expect(somarUmMes('2026-01-31')).toBe('2026-02-28')
  })
})
