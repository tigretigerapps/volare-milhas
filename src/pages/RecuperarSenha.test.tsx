// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EsqueciSenha } from './EsqueciSenha'
import { NovaSenha } from './NovaSenha'

const resetPasswordForEmail = vi.fn()
const updateUser = vi.fn()
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { resetPasswordForEmail: (...a: unknown[]) => resetPasswordForEmail(...a), updateUser: (...a: unknown[]) => updateUser(...a) } },
}))

let auth: { session: object | null; carregando: boolean }
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => auth }))

beforeEach(() => {
  resetPasswordForEmail.mockReset().mockResolvedValue({ error: null })
  updateUser.mockReset().mockResolvedValue({ error: null })
  auth = { session: null, carregando: false }
})
afterEach(cleanup)

describe('EsqueciSenha', () => {
  it('pede o link com o redirecionamento para /nova-senha e mostra a confirmação', async () => {
    render(<MemoryRouter><EsqueciSenha /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('E-mail'), ' rafael@exemplo.com ')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))

    await waitFor(() => expect(screen.getByText('Confira seu e-mail')).toBeInTheDocument())
    expect(resetPasswordForEmail).toHaveBeenCalledWith('rafael@exemplo.com', {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
  })

  it('exige o e-mail', async () => {
    render(<MemoryRouter><EsqueciSenha /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o e-mail')
    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('mostra erro traduzido quando o envio falha', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: { code: 'over_email_send_rate_limit' } })
    render(<MemoryRouter><EsqueciSenha /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas')
  })
})

function renderNovaSenha() {
  return render(
    <MemoryRouter initialEntries={['/nova-senha']}>
      <Routes>
        <Route path="/nova-senha" element={<NovaSenha />} />
        <Route path="/conta" element={<p>página da conta</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NovaSenha', () => {
  it('sem sessão, explica que o link é inválido e oferece pedir outro', () => {
    renderNovaSenha()
    expect(screen.getByText('Link inválido ou vencido')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir novo link' })).toHaveAttribute('href', '/esqueci-senha')
  })

  it('rejeita senha curta e senhas diferentes', async () => {
    auth = { session: {}, carregando: false }
    renderNovaSenha()
    await userEvent.type(screen.getByLabelText('Nova senha'), 'curta')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'curta')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
    expect(screen.getByRole('alert')).toHaveTextContent('pelo menos 8')

    await userEvent.clear(screen.getByLabelText('Nova senha'))
    await userEvent.type(screen.getByLabelText('Nova senha'), 'senhalonga1')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
    expect(screen.getByRole('alert')).toHaveTextContent('não são iguais')
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('salva a nova senha e vai para a conta', async () => {
    auth = { session: {}, carregando: false }
    renderNovaSenha()
    await userEvent.type(screen.getByLabelText('Nova senha'), 'senhalonga1')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'senhalonga1')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByText('página da conta')).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith({ password: 'senhalonga1' })
  })
})
