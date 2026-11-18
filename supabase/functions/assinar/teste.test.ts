import { describe, expect, it } from 'vitest'

import { assinaturaDoTeste, checkoutDeTesteAberto, enderecoDoSite, podeTestar, somarDias } from './teste.ts'

describe('teste grátis', () => {
  it('soma dias atravessando o mês', () => {
    expect(somarDias('2026-11-28', 7)).toBe('2026-12-05')
  })

  it('só quem nunca assinou pode testar; checkout aberto pode recomeçar', () => {
    expect(podeTestar(null)).toBe(true)
    expect(podeTestar({ status: 'pendente', asaas_subscription_id: null, data_inicio: null })).toBe(true)
    expect(podeTestar({ status: 'pendente', asaas_subscription_id: 'sub_1', data_inicio: '2026-11-01' })).toBe(false)
    expect(podeTestar({ status: 'cancelado', asaas_subscription_id: null, data_inicio: '2026-10-01' })).toBe(false)
  })

  it('reconhece o checkout de teste aberto', () => {
    expect(checkoutDeTesteAberto({ status: 'pendente', asaas_subscription_id: null, data_inicio: null, asaas_customer_id: 'cus_1' })).toBe(true)
    expect(checkoutDeTesteAberto({ status: 'pendente', asaas_subscription_id: 'sub_1', data_inicio: '2026-11-18', asaas_customer_id: 'cus_1' })).toBe(false)
  })

  it('acha a assinatura do teste: ativa, no cartão, primeira cobrança no futuro, a mais nova', () => {
    const lista = [
      { id: 'sub_paga', status: 'ACTIVE', billingType: 'UNDEFINED', nextDueDate: '2026-11-25', dateCreated: '2026-11-18' },
      { id: 'sub_velha', status: 'ACTIVE', billingType: 'CREDIT_CARD', nextDueDate: '2026-11-24', dateCreated: '2026-11-17' },
      { id: 'sub_nova', status: 'ACTIVE', billingType: 'CREDIT_CARD', nextDueDate: '2026-11-25', dateCreated: '2026-11-18' },
      { id: 'sub_removida', status: 'ACTIVE', billingType: 'CREDIT_CARD', nextDueDate: '2026-11-25', deleted: true, dateCreated: '2026-11-19' },
    ]
    expect(assinaturaDoTeste(lista, '2026-11-18')).toEqual({ id: 'sub_nova', proximaCobranca: '2026-11-25' })
    expect(assinaturaDoTeste([lista[0]], '2026-11-18')).toBeNull()
  })

  it('volta para o site de origem, ou para o padrão quando a origem é estranha', () => {
    expect(enderecoDoSite('https://volo.com.br', 'https://padrao.dev')).toBe('https://volo.com.br')
    expect(enderecoDoSite('http://localhost:5173', 'https://padrao.dev')).toBe('http://localhost:5173')
    expect(enderecoDoSite('javascript:alert(1)', 'https://padrao.dev/')).toBe('https://padrao.dev')
    expect(enderecoDoSite(null, 'https://padrao.dev')).toBe('https://padrao.dev')
  })
})
