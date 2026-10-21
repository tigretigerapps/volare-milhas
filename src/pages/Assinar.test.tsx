// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Assinar } from './Assinar'

const assinar = vi.fn()
const abrirFatura = vi.fn()
let status = 'pendente'

vi.mock('@/contexts/useAuth', () => ({ useAuth: () => ({ perfil: { status_assinatura: status } }) }))
vi.mock('@/hooks/useAssinatura', () => ({
  useAssinatura: () => ({
    carregando: false,
    assinar,
    abrirFatura,
    planos: [
      { plano: 'base', nome: 'Base', preco_mensal: 29.9, destinos_por_dia: 5, rotas_com_alerta: 2 },
      { plano: 'plus', nome: 'Plus', preco_mensal: 49.9, destinos_por_dia: 10, rotas_com_alerta: 5 },
    ],
  }),
}))

const assign = vi.fn()
beforeEach(() => {
  status = 'pendente'
  assinar.mockReset().mockResolvedValue({ erro: null, faturaUrl: 'https://asaas/fatura' })
  abrirFatura.mockReset().mockResolvedValue({ erro: null, faturaUrl: 'https://asaas/aberta' })
  assign.mockReset()
  vi.stubGlobal('location', { ...window.location, assign })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const renderizar = () => render(<MemoryRouter><Assinar /></MemoryRouter>)

describe('Assinar', () => {
  it('mostra os planos com preço e deixa o primeiro escolhido', () => {
    renderizar()
    expect(screen.getByText('R$ 29,90')).toBeInTheDocument()
    expect(screen.getByText('R$ 49,90')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Base/ })).toBeChecked()
  })

  it('exige o documento completo antes de chamar o servidor', async () => {
    renderizar()
    await userEvent.type(screen.getByLabelText('CPF ou CNPJ'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }))
    expect(screen.getByRole('alert')).toHaveTextContent('CPF (11 números) ou CNPJ')
    expect(assinar).not.toHaveBeenCalled()
  })

  it('assina o plano escolhido e leva à página de pagamento', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('radio', { name: /Plus/ }))
    await userEvent.type(screen.getByLabelText('CPF ou CNPJ'), '52998224725')
    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }))
    expect(assinar).toHaveBeenCalledWith('plus', '529.982.247-25')
    expect(assign).toHaveBeenCalledWith('https://asaas/fatura')
  })

  it('mostra o erro do servidor e não sai da página', async () => {
    assinar.mockResolvedValue({ erro: 'CPF ou CNPJ inválido. Confira os números.' })
    renderizar()
    await userEvent.type(screen.getByLabelText('CPF ou CNPJ'), '52998224726')
    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('CPF ou CNPJ inválido')
    expect(assign).not.toHaveBeenCalled()
  })

  it('avisa quando a cobrança ainda não foi gerada', async () => {
    assinar.mockResolvedValue({ erro: null, faturaUrl: null })
    renderizar()
    await userEvent.type(screen.getByLabelText('CPF ou CNPJ'), '52998224725')
    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('preparando a sua cobrança')
  })

  it('quem já tem fatura em aberto pode pagá-la direto', async () => {
    status = 'inadimplente'
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Pagar a fatura em aberto' }))
    expect(abrirFatura).toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('https://asaas/aberta')
  })

  it('quem já assina vê só o aviso', () => {
    status = 'ativo'
    renderizar()
    expect(screen.getByText('Sua assinatura está ativa')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ir para o pagamento' })).not.toBeInTheDocument()
  })
})
