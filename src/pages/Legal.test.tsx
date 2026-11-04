// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { empresa } from '@/lib/empresa'
import { Cadastro } from './Cadastro'
import { Privacidade } from './Privacidade'
import { Termos } from './Termos'

const signUp = vi.fn()
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signUp: (...a: unknown[]) => signUp(...a) } } }))
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => ({ session: null }) }))
afterEach(() => {
  cleanup()
  signUp.mockReset()
})

describe('textos legais', () => {
  it('os termos citam a empresa, o cancelamento e o direito de arrependimento', () => {
    render(<MemoryRouter><Termos /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Termos de uso' })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(empresa.cnpj))).toBeInTheDocument()
    expect(screen.getByText(/mantém o\s+acesso até o fim do período/)).toBeInTheDocument()
    expect(screen.getByText(/artigo 49/)).toBeInTheDocument()
  })
  it('a política cita os prestadores e o contato', () => {
    render(<MemoryRouter><Privacidade /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeInTheDocument()
    for (const nome of ['Supabase', 'Cloudflare', 'Asaas', 'Iddas', 'Telegram']) {
      expect(screen.getAllByText(new RegExp(nome)).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByRole('link', { name: empresa.email }).length).toBeGreaterThan(0)
  })
})

describe('Cadastro: aceite dos termos', () => {
  const preencher = async () => {
    await userEvent.type(screen.getByLabelText('Nome'), 'Ana')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhalonga1')
  }

  it('não cria a conta sem aceitar', async () => {
    render(<MemoryRouter><Cadastro /></MemoryRouter>)
    await preencher()
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(screen.getByRole('alert')).toHaveTextContent('aceite os Termos de uso')
    expect(signUp).not.toHaveBeenCalled()
  })

  it('aceitando, cria a conta e guarda a data do aceite', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null })
    render(<MemoryRouter><Cadastro /></MemoryRouter>)
    await preencher()
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(signUp).toHaveBeenCalledTimes(1)
    const opcoes = (signUp.mock.calls[0][0] as { options: { data: Record<string, unknown> } }).options
    expect(opcoes.data.termos_aceitos_em).toEqual(expect.any(String))
    expect(opcoes.data.nome).toBe('Ana')
  })
})
