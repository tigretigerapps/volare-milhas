// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { cardsVolareTour } from '@/data/volareTour'
import { CardVolareTour } from './CardVolareTour'
import { Rodape } from './Rodape'

afterEach(cleanup)

describe('Rodape', () => {
  it('traz o texto da Volare e os links legais', () => {
    render(<Rodape />, { wrapper: MemoryRouter })
    expect(screen.getByText(/Uma plataforma da Volare Tour/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute('href', '/termos')
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade')
  })
})

describe('CardVolareTour', () => {
  it('descreve a foto e só vira link quando há endereço', () => {
    const card = cardsVolareTour[0]
    const { rerender } = render(<CardVolareTour card={card} />)
    expect(screen.getByRole('img', { name: card.alt })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    rerender(<CardVolareTour card={{ ...card, url: 'https://exemplo.com' }} />)
    expect(screen.getByRole('link', { name: /Ver destinos/ })).toHaveAttribute('target', '_blank')
  })
})
