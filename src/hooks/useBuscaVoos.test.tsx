// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OfertaBanco } from '@/lib/busca'
import { useBuscaVoos } from './useBuscaVoos'

const invoke = vi.fn()
const emOfertas = vi.fn()

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
    from: () => ({ select: () => ({ in: (...args: unknown[]) => emOfertas(...args) }) }),
  },
}))

const pedido = { origem: 'GRU', destino: 'SSA', dataIda: '2026-12-15', dataVolta: null, companhias: ['GOL', 'AZUL'] }

const linha = (id: string, extra: Partial<OfertaBanco> = {}): OfertaBanco => ({
  id,
  busca_id: 'b1',
  origem: 'GRU',
  destino: 'SSA',
  data_voo: '2026-12-15',
  sentido: 'ida',
  companhia: 'GOL',
  programa: 'Smiles',
  numero_voo: 'G31650',
  cabine: 'economica',
  conexoes: 0,
  conexoes_detalhe: [],
  partida: '2026-12-15T07:10:00',
  chegada: '2026-12-15T09:40:00',
  tipo_milhas: 'smiles',
  milhas: 18500,
  taxas_rs: 38.25,
  valor_dinheiro_rs: 528.15,
  criado_em: '2026-10-16T00:00:00Z',
  aeroporto_origem: 'GRU',
  aeroporto_destino: 'SSA',
  duracao: '02:30:00',
  ...extra,
})

beforeEach(() => {
  invoke.mockReset()
  emOfertas.mockReset()
})

describe('useBuscaVoos', () => {
  it('começa ocioso', () => {
    const { result } = renderHook(() => useBuscaVoos())
    expect(result.current.estado).toEqual({ tipo: 'ocioso' })
  })

  it('chama a função, lê as ofertas das buscas que deram certo e descarta as sem comparação', async () => {
    invoke.mockResolvedValue({
      data: {
        modo: 'mock',
        buscas: [
          { companhia: 'GOL', status: 'ok', busca_id: 'b1', do_cache: false },
          { companhia: 'AZUL', status: 'erro', busca_id: null, do_cache: false, mensagem: 'Não foi possível consultar AZUL agora.' },
        ],
        uso: { destinos_usados: 1, destinos_limite: 10 },
      },
      error: null,
    })
    emOfertas.mockResolvedValue({ data: [linha('o1'), linha('o2', { milhas: null })], error: null })

    const { result } = renderHook(() => useBuscaVoos())
    await act(async () => {
      await result.current.buscar(pedido)
    })

    expect(invoke).toHaveBeenCalledWith('buscar-voos', { body: pedido })
    expect(emOfertas).toHaveBeenCalledWith('busca_id', ['b1'])
    const estado = result.current.estado
    expect(estado.tipo).toBe('pronto')
    if (estado.tipo !== 'pronto') return
    expect(estado.ofertas.map((o) => o.id)).toEqual(['o1'])
    expect(estado.falhas).toEqual(['Não foi possível consultar AZUL agora.'])
    expect(estado.uso).toEqual({ destinos_usados: 1, destinos_limite: 10 })
    expect(estado.modo).toBe('mock')
  })

  it('se nenhuma companhia respondeu, nem lê as ofertas', async () => {
    invoke.mockResolvedValue({
      data: {
        modo: 'mock',
        buscas: [{ companhia: 'GOL', status: 'erro', busca_id: null, do_cache: false, mensagem: 'falhou' }],
        uso: { destinos_usados: 0, destinos_limite: 10 },
      },
      error: null,
    })
    const { result } = renderHook(() => useBuscaVoos())
    await act(async () => {
      await result.current.buscar(pedido)
    })
    expect(emOfertas).not.toHaveBeenCalled()
    expect(result.current.estado).toMatchObject({ tipo: 'pronto', ofertas: [], falhas: ['falhou'] })
  })

  it('mostra a mensagem em português quando a função recusa (limite do plano)', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {
        name: 'FunctionsHttpError',
        context: new Response(
          JSON.stringify({
            codigo: 'limite_destinos',
            mensagem: 'Você já pesquisou 5 destinos diferentes hoje no plano Base.',
            uso: { destinos_usados: 5, destinos_limite: 5 },
          }),
          { status: 429 },
        ),
      },
    })
    const { result } = renderHook(() => useBuscaVoos())
    await act(async () => {
      await result.current.buscar(pedido)
    })
    expect(result.current.estado).toEqual({
      tipo: 'erro',
      erro: {
        codigo: 'limite_destinos',
        mensagem: 'Você já pesquisou 5 destinos diferentes hoje no plano Base.',
        uso: { destinos_usados: 5, destinos_limite: 5 },
      },
    })
  })

  it('erro ao ler as ofertas vira erro genérico', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    invoke.mockResolvedValue({
      data: { modo: 'mock', buscas: [{ companhia: 'GOL', status: 'ok', busca_id: 'b1', do_cache: true }], uso: { destinos_usados: 1, destinos_limite: null } },
      error: null,
    })
    emOfertas.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const { result } = renderHook(() => useBuscaVoos())
    await act(async () => {
      await result.current.buscar(pedido)
    })
    expect(result.current.estado).toMatchObject({ tipo: 'erro', erro: { codigo: 'erro' } })
  })

  it('só a busca mais recente atualiza a tela', async () => {
    let liberarPrimeira: (v: unknown) => void = () => {}
    invoke.mockImplementationOnce(() => new Promise((resolve) => (liberarPrimeira = resolve)))
    invoke.mockResolvedValueOnce({
      data: { modo: 'mock', buscas: [], uso: { destinos_usados: 2, destinos_limite: 10 } },
      error: null,
    })

    const { result } = renderHook(() => useBuscaVoos())
    act(() => {
      void result.current.buscar({ ...pedido, destino: 'LIS' })
    })
    await act(async () => {
      await result.current.buscar({ ...pedido, destino: 'REC' })
    })
    await act(async () => {
      liberarPrimeira({ data: { modo: 'mock', buscas: [], uso: { destinos_usados: 1, destinos_limite: 10 } }, error: null })
    })

    await waitFor(() => expect(result.current.estado.tipo).toBe('pronto'))
    const estado = result.current.estado
    expect(estado.tipo === 'pronto' && estado.pedido.destino).toBe('REC')
  })
})
