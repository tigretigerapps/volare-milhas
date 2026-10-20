import { describe, expect, it } from 'vitest'

import { formatarDataHora, referenciaLead, resumirOferta, rotuloCrm } from './admin'

describe('admin', () => {
  it('descreve a situação do CRM', () => {
    expect(rotuloCrm({ crm_status: 'enviado', crm_id: 15, crm_erro: null })).toBe('Enviado ao CRM (solicitação 15)')
    expect(rotuloCrm({ crm_status: 'falhou', crm_id: null, crm_erro: 'x' })).toBe('Falhou no envio ao CRM')
    expect(rotuloCrm({ crm_status: 'simulado', crm_id: null, crm_erro: null })).toMatch(/não enviado/)
    expect(rotuloCrm({ crm_status: 'pendente', crm_id: null, crm_erro: null })).toMatch(/Aguardando/)
  })

  it('resume a oferta guardada no lead', () => {
    expect(
      resumirOferta({ companhia: 'LATAM', numero_voo: 'LA8146', origem: 'GRU', destino: 'LIS', milhas: 128000 }),
    ).toBe('LATAM LA8146, GRU para LIS, 128.000 milhas')
    expect(resumirOferta({})).toBe('Oferta sem detalhes')
    expect(resumirOferta(null)).toBe('Oferta sem detalhes')
  })

  it('monta a referência e a data no horário de São Paulo', () => {
    expect(referenciaLead('57aab726-1111-2222-3333-444455556666')).toBe('VM-57AAB726')
    expect(formatarDataHora('2026-10-20T14:03:34Z')).toBe('20/10/2026, 11:03')
  })
})
