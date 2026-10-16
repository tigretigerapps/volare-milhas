// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Rota } from '@/lib/rotas'
import { Rotas } from './Rotas'

const acoes = {
  criar: vi.fn(),
  atualizar: vi.fn(),
  excluir: vi.fn(),
}
let estado: { rotas: Rota[]; carregando: boolean; erroCarga: string | null }

vi.mock('@/hooks/useRotas', () => ({
  useRotas: () => ({ ...estado, ...acoes }),
}))

let limiteRotas: number | null | undefined = 5
vi.mock('@/hooks/usePlano', () => ({
  usePlano: () => ({
    plano: { plano: 'plus', nome: 'Plus', destinos_por_dia: 10, rotas_com_alerta: 5 },
    assinaturaAtiva: true,
    limiteRotas,
    limiteDestinos: 10,
  }),
}))

const marcarVistos = vi.fn()
vi.mock('@/contexts/useAlertas', () => ({
  useAlertas: () => ({ alertas: [], naoVistos: 0, recente: null, marcarVistos }),
}))

const rotaLisboa: Rota = {
  id: 'r1',
  user_id: 'u1',
  origem: 'GRU',
  destino: 'LIS',
  data_inicio: '2030-12-01',
  data_fim: '2031-01-31',
  preco_alvo_milhas: 40000,
  preco_alvo_rs: null,
  companhias: ['TAP'],
  ativo: true,
  created_at: '2030-01-01T00:00:00Z',
  updated_at: '2030-01-01T00:00:00Z',
}

beforeEach(() => {
  limiteRotas = 5
  estado = { rotas: [], carregando: false, erroCarga: null }
  acoes.criar.mockResolvedValue({ erro: null })
  acoes.atualizar.mockResolvedValue({ erro: null })
  acoes.excluir.mockResolvedValue({ erro: null })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Minhas rotas', () => {
  it('mostra quantas rotas do plano estão em uso', () => {
    estado.rotas = [rotaLisboa]
    render(<Rotas />)
    expect(screen.getByTestId('uso-rotas')).toHaveTextContent('1 de 5 rotas com alerta ativas no plano Plus.')
    expect(screen.getByRole('button', { name: 'Nova rota' })).toBeEnabled()
  })

  it('no limite do plano, desliga Nova rota; pausadas não contam', () => {
    limiteRotas = 1
    estado.rotas = [rotaLisboa]
    const { unmount } = render(<Rotas />)
    expect(screen.getByRole('button', { name: 'Nova rota' })).toBeDisabled()
    unmount()

    estado.rotas = [{ ...rotaLisboa, ativo: false }]
    render(<Rotas />)
    expect(screen.getByRole('button', { name: 'Nova rota' })).toBeEnabled()
  })

  it('assinatura inativa explica por que não dá para criar', () => {
    limiteRotas = 0
    render(<Rotas />)
    expect(screen.getByTestId('uso-rotas')).toHaveTextContent('Sua assinatura não está ativa')
    expect(screen.getByRole('button', { name: 'Nova rota' })).toBeDisabled()
  })

  it('administrador não vê contador nem limite', () => {
    limiteRotas = null
    estado.rotas = [rotaLisboa]
    render(<Rotas />)
    expect(screen.queryByTestId('uso-rotas')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova rota' })).toBeEnabled()
  })

  it('abrir a tela marca os alertas como vistos', () => {
    render(<Rotas />)
    expect(marcarVistos).toHaveBeenCalled()
  })

  it('sem rotas, mostra o estado vazio e abre o formulário', async () => {
    const user = userEvent.setup()
    render(<Rotas />)

    expect(screen.getByText('Você ainda não monitora nenhuma rota.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nova rota' }))
    expect(screen.getByRole('form', { name: 'Nova rota' })).toBeInTheDocument()
  })

  it('não envia formulário inválido e mostra os erros', async () => {
    const user = userEvent.setup()
    render(<Rotas />)
    await user.click(screen.getByRole('button', { name: 'Nova rota' }))
    await user.click(screen.getByRole('button', { name: 'Salvar rota' }))

    expect(acoes.criar).not.toHaveBeenCalled()
    expect(screen.getByText('Defina um preço-alvo em milhas, em reais ou nos dois.')).toBeInTheDocument()
    expect(screen.getByLabelText('De')).toHaveAttribute('aria-invalid', 'true')
  })

  it('cria uma rota com os dados normalizados', async () => {
    const user = userEvent.setup()
    render(<Rotas />)
    await user.click(screen.getByRole('button', { name: 'Nova rota' }))

    await user.type(screen.getByLabelText('De'), 'gru')
    await user.type(screen.getByLabelText('Para'), 'lis')
    await user.type(screen.getByLabelText('Viajar a partir de'), '2030-12-01')
    await user.type(screen.getByLabelText('Até'), '2031-01-31')
    await user.type(screen.getByLabelText('Em milhas'), '40.000')
    await user.click(screen.getByLabelText('TAP Miles&Go'))
    await user.click(screen.getByRole('button', { name: 'Salvar rota' }))

    expect(acoes.criar).toHaveBeenCalledWith({
      origem: 'GRU',
      destino: 'LIS',
      data_inicio: '2030-12-01',
      data_fim: '2031-01-31',
      preco_alvo_milhas: 40000,
      preco_alvo_rs: null,
      companhias: ['TAP'],
    })
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('mantém o formulário aberto e mostra o erro quando o banco recusa', async () => {
    acoes.criar.mockResolvedValue({ erro: 'Não foi possível salvar agora. Tente de novo.' })
    const user = userEvent.setup()
    render(<Rotas />)
    await user.click(screen.getByRole('button', { name: 'Nova rota' }))
    await user.type(screen.getByLabelText('De'), 'GRU')
    await user.type(screen.getByLabelText('Para'), 'LIS')
    await user.type(screen.getByLabelText('Viajar a partir de'), '2030-12-01')
    await user.type(screen.getByLabelText('Até'), '2031-01-31')
    await user.type(screen.getByLabelText('Em reais'), '2.500,00')
    await user.click(screen.getByRole('button', { name: 'Salvar rota' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar agora.')
    expect(screen.getByRole('form', { name: 'Nova rota' })).toBeInTheDocument()
  })

  it('lista as rotas com meta, período e companhias', () => {
    estado.rotas = [rotaLisboa]
    render(<Rotas />)

    const linha = screen.getByRole('listitem')
    expect(within(linha).getByText('GRU para LIS')).toBeInTheDocument()
    expect(within(linha).getByText('até 40.000 milhas')).toBeInTheDocument()
    expect(within(linha).getByText('1 dez 2030 a 31 jan 2031, TAP Miles&Go')).toBeInTheDocument()
  })

  it('edita uma rota com os valores atuais preenchidos', async () => {
    estado.rotas = [rotaLisboa]
    const user = userEvent.setup()
    render(<Rotas />)

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    const milhas = screen.getByLabelText('Em milhas')
    expect(milhas).toHaveValue('40.000')
    await user.clear(milhas)
    await user.type(milhas, '35.000')
    await user.click(screen.getByRole('button', { name: 'Salvar rota' }))

    expect(acoes.atualizar).toHaveBeenCalledWith('r1', expect.objectContaining({ preco_alvo_milhas: 35000 }))
  })

  it('pausa e só exclui depois de confirmar', async () => {
    estado.rotas = [rotaLisboa]
    const user = userEvent.setup()
    render(<Rotas />)

    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(acoes.atualizar).toHaveBeenCalledWith('r1', { ativo: false })

    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(acoes.excluir).not.toHaveBeenCalled()
    const confirmacao = screen.getByRole('group', { name: 'Confirmar exclusão' })
    await user.click(within(confirmacao).getByRole('button', { name: 'Excluir' }))
    expect(acoes.excluir).toHaveBeenCalledWith('r1')
  })
})
