// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RotaAdmin } from './RotaAdmin'

let auth: { carregando: boolean; session: object | null; perfil: { papel: string } | null }
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => auth }))
afterEach(cleanup)

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<RotaAdmin><p>conteúdo do painel</p></RotaAdmin>} />
        <Route path="/buscar" element={<p>página de busca</p>} />
        <Route path="/entrar" element={<p>página de entrar</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('RotaAdmin', () => {
  it('mostra o painel ao administrador', () => {
    auth = { carregando: false, session: {}, perfil: { papel: 'admin' } }
    renderizar()
    expect(screen.getByText('conteúdo do painel')).toBeInTheDocument()
  })
  it('manda cliente para a busca', () => {
    auth = { carregando: false, session: {}, perfil: { papel: 'cliente' } }
    renderizar()
    expect(screen.getByText('página de busca')).toBeInTheDocument()
  })
  it('manda quem não entrou para entrar', () => {
    auth = { carregando: false, session: null, perfil: null }
    renderizar()
    expect(screen.getByText('página de entrar')).toBeInTheDocument()
  })
  it('espera o perfil carregar antes de decidir', () => {
    auth = { carregando: false, session: {}, perfil: null }
    renderizar()
    expect(screen.getByText('Carregando…')).toBeInTheDocument()
  })
})
