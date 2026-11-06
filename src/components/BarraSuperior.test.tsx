// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { BarraSuperior } from './BarraSuperior'

afterEach(cleanup)

const renderizar = (caminho: string, alertas = 0) =>
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <BarraSuperior alertasNaoLidos={alertas} />
    </MemoryRouter>,
  )

describe('BarraSuperior', () => {
  it('marca "Buscar" como página atual em /buscar/resultados', () => {
    renderizar('/buscar/resultados')
    const nav = screen.getAllByRole('navigation', { name: 'Principal' })[0]
    expect(within(nav).getByRole('link', { name: 'Buscar' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Minhas rotas' })).not.toHaveAttribute('aria-current')
  })

  it('leva o logo para a home e mostra o badge de alertas', () => {
    renderizar('/rotas', 2)
    expect(screen.getAllByRole('link', { name: 'Volo by Volare, ir para a home' })[0]).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /Minhas rotas.*2 alertas novos/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Abrir menu, 2 alertas novos' })).toBeInTheDocument()
  })
})
