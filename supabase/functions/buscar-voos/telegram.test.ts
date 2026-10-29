import { describe, expect, it } from 'vitest'

import type { Acerto, OfertaMotor, RotaAlerta } from './alertas.ts'
import { enviarMensagem, mensagemDeAlerta } from './telegram.ts'

const rota: RotaAlerta = {
  id: 'r1',
  user_id: 'u1',
  origem: 'GRU',
  destino: 'LIS',
  data_inicio: '2026-11-10',
  data_fim: '2026-11-20',
  preco_alvo_milhas: 40000,
  preco_alvo_rs: 2500,
  companhias: ['TAP'],
}
const oferta: OfertaMotor = {
  origem: 'GRU',
  destino: 'LIS',
  data_voo: '2026-11-03',
  sentido: 'ida',
  companhia: 'TAP',
  programa: 'TAP Miles&Go',
  tipo_milhas: null,
  numero_voo: 'TP82',
  conexoes: 0,
  partida: null,
  chegada: null,
  milhas: 35000,
  taxas_rs: 500,
  valor_dinheiro_rs: 5412.3,
}

describe('mensagemDeAlerta', () => {
  it('monta o texto de um alerta em milhas', () => {
    const acerto: Acerto = { oferta, criterio: 'milhas', razao: 0.875 }
    expect(mensagemDeAlerta(rota, acerto, 'https://site.exemplo/')).toBe(
      [
        'Alerta de preço: GRU para LIS',
        '35.000 milhas na TAP Miles&Go, sua meta era 40.000 milhas.',
        'Voo TP82, 03/11/2026.',
        'Ver no site: https://site.exemplo/rotas',
      ].join('\n'),
    )
  })
  it('monta o texto de um alerta em reais, sem voo nem programa', () => {
    const acerto: Acerto = { oferta: { ...oferta, numero_voo: null, programa: null, valor_dinheiro_rs: 2100 }, criterio: 'reais', razao: 0.84 }
    const texto = mensagemDeAlerta(rota, acerto, 'https://site.exemplo')
    expect(texto).toContain('R$ 2.100,00 na TAP, sua meta era R$ 2.500,00.')
    expect(texto).toContain('\n03/11/2026.')
  })
})

describe('enviarMensagem', () => {
  const simular = (status: number) => {
    const chamadas: { url: string; init: RequestInit }[] = []
    const req = ((url: string, init: RequestInit) => {
      chamadas.push({ url, init })
      return Promise.resolve(new Response('{}', { status }))
    }) as typeof fetch
    return { chamadas, req }
  }
  it('envia para o chat certo, sem formatação especial', async () => {
    const { chamadas, req } = simular(200)
    expect(await enviarMensagem('TOKEN', 42, 'oi', req)).toEqual({ ok: true, status: 200, bloqueado: false })
    expect(chamadas[0].url).toBe('https://api.telegram.org/botTOKEN/sendMessage')
    expect(JSON.parse(String(chamadas[0].init.body))).toEqual({ chat_id: 42, text: 'oi', disable_web_page_preview: true })
  })
  it('marca como bloqueado quando o usuário bloqueou o bot', async () => {
    expect((await enviarMensagem('T', 1, 'x', simular(403).req)).bloqueado).toBe(true)
    expect((await enviarMensagem('T', 1, 'x', simular(500).req)).bloqueado).toBe(false)
  })
})
