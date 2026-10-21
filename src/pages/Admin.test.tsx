// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LeadAdmin } from '@/hooks/useAdmin'
import { Admin } from './Admin'

const mudarStatus = vi.fn()
const reenviar = vi.fn()
const salvarPlano = vi.fn()
const verificarAgora = vi.fn()
let leads: LeadAdmin[]

vi.mock('@/hooks/useAdmin', () => ({
  useLeadsAdmin: () => ({ leads, carregando: false, erroCarga: null, mudarStatus, reenviar }),
  useAssinantesAdmin: () => ({
    carregando: false,
    erroCarga: null,
    assinantes: [
      { id: 'u1', nome: 'Ana', telefone: '11999990000', plano: 'plus', status_assinatura: 'ativo', papel: 'cliente', assinatura: { proxima_cobranca: '2026-11-15' } },
      { id: 'u2', nome: 'Beto', telefone: null, plano: null, status_assinatura: 'pendente', papel: 'cliente', assinatura: null },
    ],
  }),
  useAlertasAdmin: () => ({
    carregando: false,
    erroCarga: null,
    verificarAgora,
    execucoes: [
      { id: 1, iniciado_em: '2026-10-21T11:00:00Z', origem: 'agendador', rotas_verificadas: 2, buscas: 24, alertas_gerados: 1, erros: 0, detalhe: null },
    ],
  }),
  usePlanosAdmin: () => ({
    carregando: false,
    erroCarga: null,
    salvar: salvarPlano,
    planos: [{ plano: 'base', nome: 'Base', destinos_por_dia: 5, rotas_com_alerta: 2 }],
  }),
}))

const lead = (extra: Partial<LeadAdmin>): LeadAdmin =>
  ({
    id: '57aab726-1111-2222-3333-444455556666',
    created_at: '2026-10-20T14:10:45Z',
    status: 'novo',
    crm_status: 'enviado',
    crm_id: 1503686,
    crm_erro: null,
    oferta: { companhia: 'LATAM', numero_voo: 'LA8146', origem: 'GRU', destino: 'LIS', milhas: 128000 },
    profiles: { nome: 'Ana', telefone: '11999990000' },
    ...extra,
  }) as LeadAdmin

beforeEach(() => {
  mudarStatus.mockReset().mockResolvedValue({ erro: null })
  reenviar.mockReset().mockResolvedValue({ erro: null })
  salvarPlano.mockReset().mockResolvedValue({ erro: null })
  verificarAgora.mockReset().mockResolvedValue({ erro: null, resumo: { rotas_verificadas: 2, buscas: 24, alertas_gerados: 3, erros: 0 } })
  leads = [lead({})]
})
afterEach(cleanup)

describe('Admin', () => {
  it('lista os leads com cliente, oferta e situação do CRM', () => {
    render(<Admin />)
    expect(screen.getByText('VM-57AAB726')).toBeInTheDocument()
    expect(screen.getByText('LATAM LA8146, GRU para LIS, 128.000 milhas')).toBeInTheDocument()
    expect(screen.getByText('Enviado ao CRM (solicitação 1503686)')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reenviar ao CRM' })).not.toBeInTheDocument()
  })

  it('muda o status do atendimento', async () => {
    render(<Admin />)
    await userEvent.selectOptions(screen.getByLabelText(/Status do atendimento/), 'em_atendimento')
    expect(mudarStatus).toHaveBeenCalledWith(leads[0].id, 'em_atendimento')
  })

  it('oferece reenvio só para lead que falhou e avisa quantos falharam', async () => {
    leads = [lead({ crm_status: 'falhou', crm_id: null, crm_erro: 'CRM recusou' }), lead({ id: 'b'.repeat(8) + '-1111-2222-3333-444455556666' })]
    render(<Admin />)
    expect(screen.getByRole('status')).toHaveTextContent('1 lead não chegou ao CRM')
    const botoes = screen.getAllByRole('button', { name: 'Reenviar ao CRM' })
    expect(botoes).toHaveLength(1)
    await userEvent.click(botoes[0])
    expect(reenviar).toHaveBeenCalledWith(leads[0].id)
  })

  it('mostra o erro do reenvio', async () => {
    reenviar.mockResolvedValue({ erro: 'O CRM não aceitou o pedido' })
    leads = [lead({ crm_status: 'falhou', crm_id: null })]
    render(<Admin />)
    await userEvent.click(screen.getByRole('button', { name: 'Reenviar ao CRM' }))
    expect(await screen.findByText('O CRM não aceitou o pedido')).toBeInTheDocument()
  })

  it('mostra os assinantes', async () => {
    render(<Admin />)
    await userEvent.click(screen.getByRole('tab', { name: 'Assinantes' }))
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Plano plus')).toBeInTheDocument()
    expect(screen.getByText('Próxima cobrança 15/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Sem cobrança agendada')).toBeInTheDocument()
  })

  it('salva os limites de um plano e recusa valores que não são inteiros', async () => {
    render(<Admin />)
    await userEvent.click(screen.getByRole('tab', { name: 'Planos' }))
    const form = screen.getByRole('form', { name: 'Plano Base' })

    await userEvent.clear(within(form).getByLabelText('Destinos por dia'))
    await userEvent.type(within(form).getByLabelText('Destinos por dia'), '8')
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))
    expect(salvarPlano).toHaveBeenCalledWith('base', { destinos_por_dia: 8, rotas_com_alerta: 2 })

    await userEvent.clear(within(form).getByLabelText('Rotas com alerta'))
    await userEvent.type(within(form).getByLabelText('Rotas com alerta'), '-1')
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('números inteiros')
    expect(salvarPlano).toHaveBeenCalledTimes(1)
  })

  it('mostra o histórico de verificações e roda uma nova sob demanda', async () => {
    render(<Admin />)
    await userEvent.click(screen.getByRole('tab', { name: 'Alertas' }))
    expect(screen.getByText('Automática')).toBeInTheDocument()
    expect(screen.getByText(/2 rotas, 24 consultas, 1 alertas/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Verificar agora' }))
    expect(verificarAgora).toHaveBeenCalled()
    expect(await screen.findByText('Verificação concluída: 2 rotas, 3 alertas novos.')).toBeInTheDocument()
  })

  it('mostra o erro quando a verificação falha', async () => {
    verificarAgora.mockResolvedValue({ erro: 'Só administradores podem rodar a verificação.' })
    render(<Admin />)
    await userEvent.click(screen.getByRole('tab', { name: 'Alertas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Verificar agora' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Só administradores')
  })
})
