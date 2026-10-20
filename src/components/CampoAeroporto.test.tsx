// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { CampoAeroporto } from './CampoAeroporto'

afterEach(cleanup)

function Exemplo({ inicial = '' }: { inicial?: string }) {
  const [codigo, setCodigo] = useState(inicial)
  return (
    <>
      <CampoAeroporto id="campo" rotulo="Para" valor={codigo} onChange={setCodigo} />
      <output data-testid="codigo">{codigo}</output>
    </>
  )
}

describe('CampoAeroporto', () => {
  it('mostra o nome do aeroporto do código escolhido', () => {
    render(<Exemplo inicial="SSA" />)
    expect(screen.getByText('Salvador, Dep. Luís Eduardo Magalhães')).toBeInTheDocument()
  })

  it('abre a lista ao focar e escolhe um aeroporto com o clique', async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    await user.click(screen.getByLabelText('Para'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /SSA/ }))
    expect(screen.getByTestId('codigo')).toHaveTextContent('SSA')
    expect(screen.getByLabelText('Para')).toHaveValue('SSA')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('busca pelo nome da cidade e escolhe com o teclado', async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    await user.type(screen.getByLabelText('Para'), 'lisboa')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('codigo')).toHaveTextContent('LIS')
  })

  it('continua aceitando o código digitado direto', async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    await user.type(screen.getByLabelText('Para'), 'gru')
    expect(screen.getByTestId('codigo')).toHaveTextContent('GRU')
  })

  it('avisa quando nada é encontrado', async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    await user.type(screen.getByLabelText('Para'), 'xyzxyz')
    expect(screen.getByText('Nenhum aeroporto encontrado.')).toBeInTheDocument()
  })
})
