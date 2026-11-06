// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Oferta } from '@/data/exemplo'
import type { EstadoBusca } from '@/hooks/useBuscaVoos'
import { Resultados } from './Resultados'

const buscar = vi.fn()
let estado: EstadoBusca
let usuario: { id: string } | null

vi.mock('@/hooks/useBuscaVoos', () => ({ useBuscaVoos: () => ({ estado, buscar }) }))
vi.mock('@/contexts/useAlertas', () => ({
  useAlertas: () => ({ alertas: [], naoVistos: 0, recente: null, marcarVistos: vi.fn() }),
}))
vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    user: usuario,
    perfil: usuario ? { id: usuario.id, custo_milheiro: 20 } : null,
    atualizarPerfil: vi.fn().mockResolvedValue({ erro: null }),
  }),
}))

const oferta = (parcial: Partial<Oferta> = {}): Oferta => ({
  id: 'x1',
  programa: 'Smiles',
  voo: 'G31650',
  origem: 'GRU',
  destino: 'SSA',
  partida: '07:10',
  chegada: '09:40',
  paradas: [],
  duracaoMinutos: 150,
  dinheiro: 528.15,
  milhas: 18500,
  taxas: 38.25,
  sentido: 'ida',
  dataVoo: '2030-12-15',
  ...parcial,
})

const pedido = { origem: 'GRU', destino: 'SSA', dataIda: '2030-12-15', dataVolta: null, companhias: ['GOL'] }
const uso = { destinos_usados: 3, destinos_limite: 10 }

const pronto = (extra: Partial<Extract<EstadoBusca, { tipo: 'pronto' }>> = {}): EstadoBusca => ({
  tipo: 'pronto',
  pedido,
  ofertas: [oferta()],
  falhas: [],
  companhias: [{ companhia: 'GOL', status: 'ok' }],
  uso,
  modo: 'real',
  ...extra,
})

const urlBusca = '/buscar/resultados?origem=GRU&destino=SSA&ida=2030-12-15'

const montar = (url = urlBusca) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/buscar/resultados" element={<Resultados />} />
        <Route path="/entrar" element={<p>tela de entrar</p>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  estado = { tipo: 'ocioso' }
  usuario = { id: 'u1' }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Buscar sem conta', () => {
  beforeEach(() => {
    usuario = null
  })

  it('mostra os exemplos com um aviso para entrar', () => {
    montar()
    expect(screen.getByText(/resultados de exemplo/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Quero essa oferta' })).toHaveLength(4)
  })

  it('buscar de novo leva para a tela de entrar', async () => {
    montar()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Buscar de novo' }))
    expect(screen.getByText('tela de entrar')).toBeInTheDocument()
    expect(buscar).not.toHaveBeenCalled()
  })
})

describe('Buscar com conta', () => {
  it('sem busca na URL não consulta nem mostra exemplos', () => {
    montar('/buscar/resultados')
    expect(buscar).not.toHaveBeenCalled()
    expect(screen.getByText(/toque em Buscar/)).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.queryByText(/resultados de exemplo/i)).not.toBeInTheDocument()
  })

  it('consulta a busca da URL com as companhias padrão e só ida', () => {
    montar()
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(buscar).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'GRU',
        destino: 'SSA',
        dataVolta: null,
        companhias: ['GOL', 'AZUL', 'LATAM', 'TAP'],
      }),
    )
  })

  it('mostra o botão ocupado enquanto busca', () => {
    estado = { tipo: 'carregando' }
    montar()
    expect(screen.getByRole('button', { name: 'Buscando…' })).toBeDisabled()
    expect(screen.getByText('Consultando GOL…')).toBeInTheDocument()
    expect(screen.getByText('Consultando TAP…')).toBeInTheDocument()
  })

  it('mostra os resultados com o veredito e o uso do dia', () => {
    estado = pronto()
    montar()
    const linha = screen.getByRole('listitem')
    expect(within(linha).getByText(/Milhas economizam/)).toBeInTheDocument()
    expect(within(linha).getByText('Smiles, voo G31650')).toBeInTheDocument()
    expect(screen.getByTestId('uso-destinos')).toHaveTextContent('Hoje: 3 de 10 destinos diferentes.')
  })

  it('banco fake é avisado como teste; busca real não', () => {
    estado = pronto({ modo: 'mock' })
    montar()
    expect(screen.getByText(/Resultados de teste/)).toBeInTheDocument()
    cleanup()
    estado = pronto({ modo: 'real' })
    montar()
    expect(screen.queryByText(/Resultados de teste/)).not.toBeInTheDocument()
  })

  it('ida e volta aparecem em blocos separados, com as datas', () => {
    estado = pronto({
      pedido: { ...pedido, dataVolta: '2030-12-22' },
      ofertas: [oferta({ id: 'i' }), oferta({ id: 'v', sentido: 'volta', origem: 'SSA', destino: 'GRU', partida: '11:20', chegada: '14:00' })],
    })
    montar()
    expect(screen.getByRole('heading', { name: 'Ida, 15 dez 2030' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Volta, 22 dez 2030' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Volta, 22 dez 2030' })).getByText(/SSA para GRU, direto/)).toBeInTheDocument()
  })

  it('sem voos, explica em vez de deixar a tela vazia', () => {
    estado = pronto({ ofertas: [] })
    montar()
    expect(screen.getByText(/Nenhuma tarifa encontrada para essa data/)).toBeInTheDocument()
  })

  it('mostra a companhia que falhou, sem esconder as outras, e deixa tentar de novo', async () => {
    estado = pronto({
      companhias: [
        { companhia: 'GOL', status: 'ok' },
        { companhia: 'TAP', status: 'erro', mensagem: 'falhou' },
      ],
    })
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não conseguimos consultar a TAP agora. As outras companhias não foram afetadas.',
    )
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    buscar.mockClear()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(buscar).toHaveBeenCalledTimes(1)
  })

  it('avisa a companhia que respondeu sem voos', () => {
    estado = pronto({
      ofertas: [oferta({ companhia: 'GOL' })],
      companhias: [
        { companhia: 'GOL', status: 'ok' },
        { companhia: 'AZUL', status: 'ok' },
      ],
    })
    montar()
    expect(screen.getByText('Azul sem voos nessa data')).toBeInTheDocument()
    expect(screen.queryByText('GOL sem voos nessa data')).not.toBeInTheDocument()
  })

  it('título com cidades e data por extenso e a contagem de tarifas', () => {
    estado = pronto({ ofertas: [oferta({ companhia: 'GOL' }), oferta({ id: 'x2', companhia: 'LATAM' })] })
    montar()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('São Paulo para Salvador, 15 de dezembro')
    expect(screen.getByText(/2 tarifas em 2 companhias, comparadas com o seu milheiro de/)).toBeInTheDocument()
  })

  it('mostra o erro da busca (limite do plano) e o uso', () => {
    estado = {
      tipo: 'erro',
      erro: {
        codigo: 'limite_destinos',
        mensagem: 'Você já pesquisou 5 destinos diferentes hoje no plano Base.',
        uso: { destinos_usados: 5, destinos_limite: 5 },
      },
    }
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent('plano Base')
    expect(screen.getByTestId('uso-destinos')).toHaveTextContent('Hoje: 5 de 5 destinos diferentes.')
  })

  it('administrador (sem limite) não vê contador de destinos', () => {
    estado = pronto({ uso: { destinos_usados: 3, destinos_limite: null } })
    montar()
    expect(screen.queryByTestId('uso-destinos')).not.toBeInTheDocument()
  })

  it('ordena por maior economia e depois por horário', async () => {
    estado = pronto({
      ofertas: [
        oferta({ id: 'cedo', partida: '06:00', chegada: '08:30', milhas: 30000 }),
        oferta({ id: 'tarde', partida: '18:00', chegada: '20:30', milhas: 12000 }),
      ],
    })
    montar()
    const horarios = () =>
      screen.getAllByRole('listitem').map((li) => within(li).getByText(/\d\d:\d\d – \d\d:\d\d/).textContent)
    // 12.000 milhas economizam mais que 30.000: a economia põe o voo da tarde primeiro.
    expect(horarios()).toEqual(['18:00 – 20:30', '06:00 – 08:30'])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Horário' }))
    expect(horarios()).toEqual(['06:00 – 08:30', '18:00 – 20:30'])
  })
})
