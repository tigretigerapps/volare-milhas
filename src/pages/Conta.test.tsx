// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Conta } from './Conta'

const cancelar = vi.fn()
const reativar = vi.fn()
let assinatura: { status: string; proxima_cobranca: string | null; acesso_ate: string | null } | null

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'a@b.com' },
    perfil: { id: 'u1', nome: 'Ana', telefone: null, custo_milheiro: null, plano: 'plus', status_assinatura: 'ativo', papel: 'cliente' },
    atualizarPerfil: vi.fn(),
    sair: vi.fn(),
  }),
}))
vi.mock('@/hooks/usePlano', () => ({ usePlano: () => ({ plano: { destinos_por_dia: 10, rotas_com_alerta: 5 } }) }))
vi.mock('@/hooks/useSincronizarAssinatura', () => ({ useSincronizarAssinatura: () => undefined }))
vi.mock('@/hooks/useMinhaAssinatura', () => ({
  useMinhaAssinatura: () => ({ assinatura, carregando: false, cancelar, reativar }),
}))

beforeEach(() => {
  assinatura = { status: 'ativo', proxima_cobranca: '2026-11-28', acesso_ate: null }
  cancelar.mockReset().mockResolvedValue({ erro: null })
  reativar.mockReset().mockResolvedValue({ erro: null, faturaUrl: null })
})
afterEach(cleanup)

const renderizar = () => render(<MemoryRouter><Conta /></MemoryRouter>)

describe('Conta: cancelar assinatura', () => {
  it('mostra quando renova e pede confirmação antes de cancelar', async () => {
    renderizar()
    expect(screen.getByText('Renova em 28/11/2026.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar assinatura' }))
    expect(cancelar).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toHaveTextContent('acesso até 28/11/2026')

    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }))
    expect(cancelar).toHaveBeenCalledTimes(1)
  })

  it('permite desistir do cancelamento', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar assinatura' }))
    await userEvent.click(screen.getByRole('button', { name: 'Manter assinatura' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(cancelar).not.toHaveBeenCalled()
  })

  it('mostra o erro do cancelamento', async () => {
    cancelar.mockResolvedValue({ erro: 'Não foi possível cancelar agora.' })
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar assinatura' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível cancelar agora.')
  })

  it('assinatura cancelada mostra até quando vai o acesso e oferece reativar', async () => {
    assinatura = { status: 'ativo', proxima_cobranca: '2026-11-28', acesso_ate: '2026-11-28' }
    renderizar()
    expect(screen.getByText('Assinatura cancelada. Seu acesso vai até 28/11/2026.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar assinatura' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reativar assinatura' }))
    expect(reativar).toHaveBeenCalledWith('plus')
  })
})
