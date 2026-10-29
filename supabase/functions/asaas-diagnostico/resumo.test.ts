import { describe, expect, it } from 'vitest'

import { divergencia, EVENTOS_NECESSARIOS, resumirCobranca, resumirWebhook } from './resumo.ts'

describe('resumirWebhook', () => {
  it('resume a configuração sem expor token e lista os eventos que faltam', () => {
    const r = resumirWebhook({
      name: 'Volare Milhas',
      url: 'https://x/asaas-webhook',
      enabled: true,
      interrupted: true,
      penalizedRequestsCount: 2,
      sendType: 'NON_SEQUENTIALLY',
      apiVersion: 3,
      hasAuthToken: true,
      authToken: 'SEGREDO',
      events: ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'],
    })
    expect(r).toMatchObject({ ativo: true, filaInterrompida: true, requisicoesPenalizadas: 2, temToken: true, totalEventos: 2 })
    expect(JSON.stringify(r)).not.toContain('SEGREDO')
    expect(r.eventosFaltando).toEqual(EVENTOS_NECESSARIOS.filter((e) => e !== 'PAYMENT_RECEIVED' && e !== 'PAYMENT_CONFIRMED'))
  })
  it('aguenta resposta vazia', () => {
    expect(resumirWebhook({})).toMatchObject({ ativo: false, temToken: false, totalEventos: 0 })
  })
})

const cobranca = (status: string) => resumirCobranca({ status, dueDate: '2026-10-28', value: 49.9, billingType: 'CREDIT_CARD' })

describe('divergencia', () => {
  const ativa = { status: 'ACTIVE', deleted: false }
  it('não acusa nada quando bate', () => {
    expect(divergencia({ status: 'ativo', acessoAte: null }, ativa, [cobranca('RECEIVED')])).toBeNull()
    expect(divergencia({ status: 'pendente', acessoAte: null }, ativa, [cobranca('PENDING')])).toBeNull()
    expect(divergencia({ status: 'ativo', acessoAte: '2026-11-28' }, { status: 'INACTIVE', deleted: true }, [cobranca('RECEIVED')])).toBeNull()
  })
  it('acusa cancelamento que o webhook não registrou', () => {
    expect(divergencia({ status: 'ativo', acessoAte: null }, { status: 'INACTIVE', deleted: true }, [])).toMatch(/Cancelada no Asaas/)
  })
  it('acusa pagamento que o webhook não registrou', () => {
    expect(divergencia({ status: 'pendente', acessoAte: null }, ativa, [cobranca('RECEIVED')])).toMatch(/Paga no Asaas/)
  })
  it('acusa atraso que o webhook não registrou', () => {
    expect(divergencia({ status: 'ativo', acessoAte: null }, ativa, [cobranca('OVERDUE')])).toMatch(/vencida no Asaas/)
  })
  it('acusa regularização que o webhook não registrou', () => {
    expect(divergencia({ status: 'inadimplente', acessoAte: null }, ativa, [cobranca('RECEIVED')])).toMatch(/Sem cobrança em aberto/)
  })
})
