// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AtivarTeste } from './AtivarTeste'

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ user: null, perfil: null, atualizarPerfil: vi.fn() }),
}))

afterEach(cleanup)

describe('Ativar teste grátis', () => {
  it('mostra os textos aprovados', () => {
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    expect(screen.getByRole('heading', { level: 1, name: 'Ative seu teste grátis' })).toBeInTheDocument()
    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument()
    expect(screen.getByText(/acontece só depois de 30 dias/)).toHaveTextContent('R$ 29,90')
    expect(screen.getByText(/O cartão não passa pelo Volo/)).toBeInTheDocument()
  })

  it('mascara o CPF e recusa um inválido, ligando o erro ao campo', async () => {
    const user = userEvent.setup()
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    const campo = screen.getByLabelText('CPF')
    await user.type(campo, '52998224724')
    expect(campo).toHaveValue('529.982.247-24')
    await user.click(screen.getByRole('button', { name: 'Ativar teste grátis' }))
    expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido. Confira os números.')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription(/CPF inválido/)
  })

  it('CPF válido não chama serviço nenhum: só confirma na tela', async () => {
    const user = userEvent.setup()
    const fetch = vi.spyOn(globalThis, 'fetch')
    render(<AtivarTeste />, { wrapper: MemoryRouter })
    await user.type(screen.getByLabelText('CPF'), '52998224725')
    await user.click(screen.getByRole('button', { name: 'Ativar teste grátis' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('CPF conferido')
    expect(fetch).not.toHaveBeenCalled()
  })
})
