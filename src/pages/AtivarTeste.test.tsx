// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AtivarTeste } from './AtivarTeste'

const ativarTeste = vi.fn()
let statusAssinatura: string | null = null

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, perfil: statusAssinatura ? { status_assinatura: statusAssinatura } : null }),
}))
vi.mock('@/hooks/useAssinatura', () => ({
  useAssinatura: () => ({
    carregando: false,
    planos: [
      { plano: 'base', nome: 'Base', preco_mensal: 29.9, destinos_por_dia: 5, rotas_com_alerta: 2 },
      { plano: 'plus', nome: 'Plus', preco_mensal: 49.9, destinos_por_dia: 10, rotas_com_alerta: 5 },
    ],
    ativarTeste,
  }),
}))

beforeEach(() => {
  statusAssinatura = null
  ativarTeste.mockReset()
})
afterEach(cleanup)

describe('Ativar teste grátis', () => {
  it('mostra 7 dias, o preço e as rotas do plano escolhido', async () => {
    const user = userEvent.setup()
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    expect(screen.getByRole('heading', { level: 1, name: 'Ative seu teste grátis' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('7 dias para testar, sem pagar nada')
    expect(screen.getByText(/acontece só depois de 7 dias/)).toHaveTextContent('R$ 29,90')
    expect(screen.getByText(/Salve até 2 rotas/)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Plus/ }))
    expect(screen.getByText(/acontece só depois de 7 dias/)).toHaveTextContent('R$ 49,90')
    expect(screen.getByText(/Salve até 5 rotas/)).toBeInTheDocument()
  })

  it('recusa CPF inválido sem chamar o servidor', async () => {
    const user = userEvent.setup()
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    const campo = screen.getByLabelText('CPF')
    await user.type(campo, '52998224724')
    expect(campo).toHaveValue('529.982.247-24')
    await user.click(screen.getByRole('button', { name: 'Ativar teste grátis' }))
    expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido. Confira os números.')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(ativarTeste).not.toHaveBeenCalled()
  })

  it('CPF válido abre o checkout do Asaas com o plano escolhido', async () => {
    const user = userEvent.setup()
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    ativarTeste.mockResolvedValue({ erro: null, faturaUrl: 'https://sandbox.asaas.com/checkoutSession/abc' })
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    await user.click(screen.getByRole('radio', { name: /Plus/ }))
    await user.type(screen.getByLabelText('CPF'), '52998224725')
    await user.click(screen.getByRole('button', { name: 'Ativar teste grátis' }))
    expect(ativarTeste).toHaveBeenCalledWith('plus', '529.982.247-25')
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://sandbox.asaas.com/checkoutSession/abc'))
    vi.unstubAllGlobals()
  })

  it('teste já usado: mostra o motivo e leva aos planos pagos', async () => {
    const user = userEvent.setup()
    ativarTeste.mockResolvedValue({ erro: 'O teste grátis já foi usado nesta conta ou com este CPF.', codigo: 'teste_usado' })
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    await user.type(screen.getByLabelText('CPF'), '52998224725')
    await user.click(screen.getByRole('button', { name: 'Ativar teste grátis' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('já foi usado')
    expect(screen.getByRole('link', { name: 'Ver planos' })).toHaveAttribute('href', '/assinar')
  })

  it('quem já assina vê o aviso em vez do formulário', () => {
    statusAssinatura = 'ativo'
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    expect(screen.getByRole('heading', { name: 'Sua assinatura já está ativa' })).toBeInTheDocument()
    expect(screen.queryByLabelText('CPF')).not.toBeInTheDocument()
  })
})
