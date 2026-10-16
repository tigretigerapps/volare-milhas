// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LinhaAlerta } from '@/lib/alertas'
import { AlertasProvider } from './AlertasProvider'
import { useAlertas } from './useAlertas'

let usuario: { id: string } | null
let linhas: LinhaAlerta[]
let erro: unknown

vi.mock('./useAuth', () => ({ useAuth: () => ({ user: usuario }) }))
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: erro ? null : linhas, error: erro }),
        }),
      }),
    }),
  },
}))

const agora = Date.now()
const horasAtras = (h: number) => new Date(agora - h * 3_600_000).toISOString()

const linha = (id: string, horas: number): LinhaAlerta => ({
  id,
  enviado_em: horasAtras(horas),
  oferta_chave: id,
  oferta: { programa: 'TAP Miles&Go', milhas: 35000 },
  rotas_salvas: { origem: 'GRU', destino: 'LIS', preco_alvo_milhas: 40000, preco_alvo_rs: null },
})

function Painel() {
  const { naoVistos, recente, marcarVistos } = useAlertas()
  return (
    <div>
      <p data-testid="nao-vistos">{naoVistos}</p>
      <p data-testid="recente">{recente ? `${recente.origem}-${recente.destino}` : 'nenhum'}</p>
      <button onClick={marcarVistos}>ver</button>
    </div>
  )
}

const montar = () =>
  render(
    <AlertasProvider>
      <Painel />
    </AlertasProvider>,
  )

beforeEach(() => {
  usuario = { id: 'u1' }
  linhas = [linha('a', 2), linha('b', 30)]
  erro = null
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AlertasProvider', () => {
  it('sem sessão não mostra nada', () => {
    usuario = null
    montar()
    expect(screen.getByTestId('nao-vistos')).toHaveTextContent('0')
    expect(screen.getByTestId('recente')).toHaveTextContent('nenhum')
  })

  it('com sessão, conta os alertas e expõe o mais recente', async () => {
    montar()
    await waitFor(() => expect(screen.getByTestId('nao-vistos')).toHaveTextContent('2'))
    expect(screen.getByTestId('recente')).toHaveTextContent('GRU-LIS')
  })

  it('marcar como visto zera o badge e lembra a visita', async () => {
    montar()
    await waitFor(() => expect(screen.getByTestId('nao-vistos')).toHaveTextContent('2'))

    await act(async () => screen.getByText('ver').click())
    expect(screen.getByTestId('nao-vistos')).toHaveTextContent('0')
    expect(window.localStorage.getItem('volare:alertas-vistos:u1')).toBe(linhas[0].enviado_em)

    // Ao reabrir o app, a visita continua registrada.
    cleanup()
    montar()
    await waitFor(() => expect(screen.getByTestId('recente')).toHaveTextContent('GRU-LIS'))
    expect(screen.getByTestId('nao-vistos')).toHaveTextContent('0')
  })

  it('a visita de um usuário não vale para outro', async () => {
    window.localStorage.setItem('volare:alertas-vistos:outro', linhas[0].enviado_em)
    montar()
    await waitFor(() => expect(screen.getByTestId('nao-vistos')).toHaveTextContent('2'))
  })

  it('alerta antigo não aparece na faixa, mas continua contando como novo', async () => {
    linhas = [linha('velho', 24 * 10)]
    montar()
    await waitFor(() => expect(screen.getByTestId('nao-vistos')).toHaveTextContent('1'))
    expect(screen.getByTestId('recente')).toHaveTextContent('nenhum')
  })

  it('se o banco falhar, segue sem alertas e sem quebrar', async () => {
    erro = { message: 'falha' }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    montar()
    await waitFor(() => expect(console.error).toHaveBeenCalled())
    expect(screen.getByTestId('nao-vistos')).toHaveTextContent('0')
  })
})
