// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BarraBusca } from './BarraBusca'

afterEach(cleanup)

// Uma data bem no futuro, para nunca cair antes de hoje.
const inicial = { origem: 'GRU', destino: 'LIS', ida: '2030-03-05', volta: '' }

function diaDoCalendario(dia: string) {
  const calendario = screen.getByRole('dialog')
  return within(calendario)
    .getAllByRole('button')
    .find((b) => b.closest('[role="grid"]') && b.textContent?.trim() === dia)!
}

describe('BarraBusca, calendário de ida e volta', () => {
  it('primeiro toque marca a ida, o segundo marca a volta e fecha', () => {
    const onBuscar = vi.fn()
    render(<BarraBusca inicial={inicial} onBuscar={onBuscar} />)

    fireEvent.click(screen.getByLabelText('Ida'))
    fireEvent.click(diaDoCalendario('10'))
    expect(screen.getByText('Agora a volta.')).toBeInTheDocument()

    fireEvent.click(diaDoCalendario('17'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onBuscar).toHaveBeenCalledWith({ origem: 'GRU', destino: 'LIS', ida: '2030-03-10', volta: '2030-03-17' })
  })

  it('"Só ida" limpa a volta', () => {
    const onBuscar = vi.fn()
    render(<BarraBusca inicial={{ ...inicial, volta: '2030-03-12' }} onBuscar={onBuscar} />)

    fireEvent.click(screen.getByLabelText('Volta'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Só ida' }))
    expect(screen.getByLabelText('Volta')).toHaveTextContent('Só ida')

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onBuscar).toHaveBeenCalledWith({ ...inicial, volta: '' })
  })

  it('sem data de ida, Buscar abre o calendário em vez de buscar', () => {
    const onBuscar = vi.fn()
    render(<BarraBusca inicial={{ ...inicial, ida: '' }} onBuscar={onBuscar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onBuscar).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Escolha a data de ida' })).toBeInTheDocument()
  })
})
